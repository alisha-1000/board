import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs/bin/rough";
import boardContext from "../../store/board-context";
import toolboxContext from "../../store/toolbox-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import Comment from "../Comment";
import Chat from "../Chat";
import Notification from "../Notification";
import { getSvgPathFromStroke, restoreElements } from "../../utils/element";
import getStroke from "perfect-freehand";
import classes from "./index.module.css";

/* ---------------- HELPERS ---------------- */
const getUserColor = (email) => {
  if (!email) return "#3498db";
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

function Board({ id }) {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const isLocalChangeRef = useRef(false); // Prevents synchronization loops

  const {
    activeToolItem,
    elements,
    toolActionType,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo,
    redo,
    setCanvasId,
    setElements,
    setRemoteElements, // Update local state from socket
    currentUser,
    setSharedEmails,
    socket,
  } = useContext(boardContext);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const { toolboxState } = useContext(toolboxContext);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState(null); // { x, y }
  const [presence, setPresence] = useState([]); // List of { userId, email, socketId }
  const [chatMessages, setChatMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const lastEmitTime = useRef(0); // For throttling socket emissions


  /* Update Canvas ID */
  useEffect(() => {
    if (!id) return;
    setCanvasId(id);
  }, [id, setCanvasId]);

  useEffect(() => {
    if (!id || !socket) return;

    socket.emit("joinCanvas", { canvasId: id });

    const handleReceive = (updatedElements) => {
      setRemoteElements(updatedElements.map(restoreElements));
    };

    const handleLoad = ({ elements, comments, messages, sharedEmails }) => {
      setElements(elements.map(restoreElements));
      setComments(comments || []);
      setChatMessages(messages || []);
      setSharedEmails(sharedEmails || []);
    };

    const handleSharingUpdate = ({ sharedEmails }) => {
      setSharedEmails(sharedEmails);
    };

    const handleCanvasShared = ({ userId }) => {
      if (currentUserRef.current && String(currentUserRef.current._id) === String(userId)) {
        setNotifications((prev) => [
          ...prev,
          { id: Date.now(), message: "A board has been shared with you! Check your sidebar.", type: "success" }
        ]);
      }
    };

    const handleNewComment = (comment) => {
      setComments((prev) => [...prev, comment]);
    };

    const handleNewMessage = (message) => {
      setChatMessages((prev) => {
        // Prevents adding duplicate messages if it's an optimistic update that has been confirmed by the server
        if (message.clientMsgId && prev.some(m => m.clientMsgId === message.clientMsgId)) {
          return prev.map(m => m.clientMsgId === message.clientMsgId ? message : m);
        }
        return [...prev, message];
      });

      if (message.email !== currentUserRef.current?.email) {
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            message: `New message from ${message.author}`,
            type: "success"
          }
        ]);
      }
    };

    const handleNotification = (notif) => {
      setNotifications((prev) => [...prev, { ...notif, id: Date.now() }]);
    };

    const handleUnauthorized = () => {
      setIsAuthorized(false);
    };



    const handlePresenceUpdate = (users) => {
      setPresence(users);
    };

    socket.on("receiveDrawingUpdate", handleReceive);
    socket.on("loadCanvas", handleLoad);
    socket.on("newMessage", handleNewMessage);
    socket.on("newComment", handleNewComment);
    socket.on("sharingUpdate", handleSharingUpdate);
    socket.on("canvasShared", handleCanvasShared);
    socket.on("presenceUpdate", handlePresenceUpdate);
    socket.on("notification", handleNotification);
    socket.on("unauthorized", handleUnauthorized);

    return () => {
      socket.off("receiveDrawingUpdate", handleReceive);
      socket.off("loadCanvas", handleLoad);
      socket.off("newMessage", handleNewMessage);
      socket.off("newComment", handleNewComment);
      socket.off("sharingUpdate", handleSharingUpdate);
      socket.off("canvasShared", handleCanvasShared);
      socket.off("presenceUpdate", handlePresenceUpdate);
      socket.off("notification", handleNotification);
      socket.off("unauthorized", handleUnauthorized);
    };
  }, [id, setElements, setSharedEmails, setRemoteElements, socket]);

  /* Canvas Sizing */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  /* ---------------- KEYBOARD SHORTCUTS ---------------- */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent board shortcuts if user is typing in input or textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.ctrlKey && e.key === "z") undo();
      if (e.ctrlKey && e.key === "y") redo();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  /* Drawing Synchronization */
  useEffect(() => {
    if (!socket || !id) return;

    if (!isLocalChangeRef.current) return;

    if (toolActionType === TOOL_ACTION_TYPES.DRAWING ||
      toolActionType === TOOL_ACTION_TYPES.ERASING ||
      toolActionType === TOOL_ACTION_TYPES.WRITING) {
      socket.emit("drawingUpdate", { canvasId: id, elements });
    }

    if (toolActionType === TOOL_ACTION_TYPES.NONE) {
      setIsSaving(true);
      socket.emit("saveCanvas", { canvasId: id, elements });
      isLocalChangeRef.current = false;

      const timer = setTimeout(() => setIsSaving(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [elements, toolActionType, id, socket]);

  /* Drawing Render */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    elements.forEach((element) => {
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          if (!element.roughEle) {
            return;
          }
          roughCanvas.draw(element.roughEle);
          break;

        case TOOL_ITEMS.BRUSH: {
          context.fillStyle = element.stroke;
          const stroke = getStroke(element.points, {
            size: element.size,
            thinning: 0.6,
            smoothing: 0.5,
            streamline: 0.5,
          });
          const path = new Path2D(getSvgPathFromStroke(stroke));
          context.fill(path);
          break;
        }

        case TOOL_ITEMS.TEXT:
          context.textBaseline = "top";
          context.font = `${element.size}px Caveat`;
          context.fillStyle = element.stroke;
          context.fillText(element.text, element.x1, element.y1);
          break;

        default:
          break;
      }
    });
  }, [elements]);

  /* Mouse Event Handlers */
  useEffect(() => {
    if (toolActionType === TOOL_ACTION_TYPES.WRITING && textAreaRef.current) {
      setTimeout(() => {
        textAreaRef.current.focus();
      }, 0);
    }
  }, [toolActionType]);

  const handleMouseDown = (e) => {
    if (!isAuthorized) return;

    const { clientX, clientY } = e;
    isLocalChangeRef.current = true;

    if (activeToolItem === TOOL_ITEMS.COMMENT) {
      setNewComment({ x: clientX, y: clientY });
      return;
    }

    boardMouseDownHandler(e, toolboxState);
  };

  const handleMouseMove = (e) => {
    if (!isAuthorized) return;
    boardMouseMoveHandler(e);
    isLocalChangeRef.current = true;

    const now = Date.now();
    if (socket && now - lastEmitTime.current > 30) {
      lastEmitTime.current = now;
    }
  };

  const handleMouseUp = () => {
    if (!isAuthorized) return;
    boardMouseUpHandler();
  };

  return (
    <div className={classes.dashboard}>
      <canvas
        ref={canvasRef}
        id="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        aria-label="Collaborative Drawing Area"
        role="img"
      />

      {notifications.map((n) => (
        <Notification
          key={n.id}
          message={n.message}
          type={n.type}
          onClose={() => setNotifications((prev) => prev.filter((item) => item.id !== n.id))}
        />
      ))}

      <Chat
        messages={chatMessages}
        currentUser={currentUser}
        onSendMessage={(text) => {
          const userEmail = currentUser?.email || "Guest";
          const messageData = {
            text,
            author: userEmail.split("@")[0],
            email: userEmail,
            userId: currentUser?._id,
            createdAt: new Date().toISOString(),
            clientMsgId: `cms-${Date.now()}-${Math.random()}`
          };

          // Optimistic Update
          setChatMessages((prev) => [...prev, messageData]);

          if (socket) {
            socket.emit("sendMessage", {
              canvasId: id,
              message: messageData
            });
          }
        }}
      />

      <section className={classes.presenceContainer} aria-label="Online Participants">
        <div className={classes.presenceRow}>
          <div className={classes.savingIndicator}>
            {isSaving ? "Saving..." : "Saved"}
          </div>
        </div>

        <div className={classes.badgeRow}>
          {presence.map((user) => (
            <div
              key={user.socketId}
              className={classes.userBadge}
              style={{ backgroundColor: getUserColor(user.email) }}
              data-email={user.email}
              title={user.email}
              role="status"
              aria-label={`User ${user.email} is active`}
            >
              {user.email?.[0]?.toUpperCase() || "G"}
            </div>
          ))}
        </div>
      </section>

      {toolActionType === TOOL_ACTION_TYPES.WRITING && (() => {
        const writingElement = elements[elements.length - 1];
        if (!writingElement || writingElement.type !== TOOL_ITEMS.TEXT) return null;

        return (
          <textarea
            ref={textAreaRef}
            className={classes.textElementBox}
            style={{
              top: writingElement.y1,
              left: writingElement.x1,
              fontSize: `${writingElement.size}px`,
              color: writingElement.stroke,
              border: "1px dashed rgba(0,0,0,0.5)",
              background: "transparent",
            }}
            onKeyDown={(e) => e.stopPropagation()}
            onBlur={(e) => textAreaBlurHandler(e.target.value)}
          />
        );
      })()}

      <section aria-label="Comments">
        {comments.map((comment, index) => (
          <Comment
            key={index}
            x={comment.x}
            y={comment.y}
            text={comment.text}
            author={comment.author}
            createdAt={comment.createdAt}
          />
        ))}
      </section>

      {newComment && (
        <div
          style={{
            position: "absolute",
            left: newComment.x,
            top: newComment.y,
            zIndex: 20,
            background: "white",
            padding: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            borderRadius: "4px",
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Type comment..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.value.trim()) {
                const commentData = {
                  text: e.target.value,
                  x: newComment.x,
                  y: newComment.y,
                  author: currentUser?.email?.split("@")[0] || "Guest",
                };

                if (socket) {
                  socket.emit("addComment", {
                    canvasId: id,
                    comment: commentData,
                  });
                }

                setNewComment(null);
              } else if (e.key === "Escape") {
                setNewComment(null);
              }
            }}
            onBlur={() => setNewComment(null)}
            style={{ border: "1px solid #ccc", padding: "4px", borderRadius: "4px" }}
          />
        </div>
      )}
    </div>
  );
}

export default Board;
