import React, { useState, useEffect, useRef } from "react";
import classes from "./index.module.css";

const Chat = ({ messages, onSendMessage, currentUser }) => {
    const [inputText, setInputText] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const prevMessagesRef = useRef(messages);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setUnreadCount(0); // Reset unread count when opened
        }
    }, [messages, isOpen]);

    /* Handle unread count for messages received while chat is closed */
    useEffect(() => {
        if (!isOpen && messages.length > prevMessagesRef.current.length) {
            const newMessages = messages.slice(prevMessagesRef.current.length);
            const foreignMessages = newMessages.filter(m => m.email !== currentUser?.email);
            if (foreignMessages.length > 0) {
                setUnreadCount(prev => prev + foreignMessages.length);
            }
        }
        prevMessagesRef.current = messages;
    }, [messages, isOpen, currentUser?.email]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        onSendMessage(inputText);
        setInputText("");
    };

    /* Generate a unique color from an email string */
    const getUserColor = (email) => {
        if (!email) return "#3498db";
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            hash = email.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return "#" + "00000".substring(0, 6 - c.length) + c;
    };

    return (
        <div className={classes.chatWrapper}>
            <button className={classes.toggleButton} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? "✕" : (
                    <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        {unreadCount > 0 && (
                            <span className={classes.unreadBadge}>{unreadCount}</span>
                        )}
                    </>
                )}
            </button>

            {isOpen && (
                <div className={classes.chatContainer}>
                    <div className={classes.chatHeader}>
                        <span className={classes.liveDot}></span>
                        Collaborative Chat
                    </div>

                    <div className={classes.messagesList}>
                        {messages.length === 0 ? (
                            <div className={classes.noMessages}>No messages yet. Start the conversation!</div>
                        ) : (
                            messages.map((msg) => {
                                const isOwn = msg.email === currentUser?.email;
                                const userColor = isOwn ? "#0084ff" : getUserColor(msg.email);
                                const initials = (msg.author || msg.email || "G").substring(0, 1).toUpperCase();

                                return (
                                    <div
                                        key={msg.clientMsgId || msg._id || msg.createdAt || Math.random()}
                                        className={`${classes.messageRow} ${isOwn ? classes.ownRow : ""}`}
                                    >
                                        {!isOwn && (
                                            <div
                                                className={classes.avatar}
                                                style={{ backgroundColor: userColor }}
                                                title={msg.author || msg.email}
                                            >
                                                {initials}
                                            </div>
                                        )}
                                        <div
                                            className={`${classes.messageItem} ${isOwn ? classes.ownMessage : ""}`}
                                            style={{ borderLeft: isOwn ? "none" : `3px solid ${userColor}` }}
                                        >
                                            <div className={classes.author} style={{ color: isOwn ? "#fff" : userColor, opacity: isOwn ? 0.8 : 1 }}>
                                                {isOwn ? "You" : (msg.author || "Guest")}
                                                {msg.isOwner && <span className={classes.ownerBadge}>OWNER</span>}
                                            </div>
                                            <div className={classes.text}>{msg.text}</div>
                                            <div className={classes.time}>
                                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                            </div>
                                        </div>
                                        {isOwn && (
                                            <div
                                                className={classes.avatar}
                                                style={{ backgroundColor: userColor }}
                                                title="You"
                                            >
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className={classes.inputArea} onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button type="submit" className={classes.sendButton}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Chat;
