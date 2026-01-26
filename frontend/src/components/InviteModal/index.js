import React, { useContext } from "react";
import boardContext from "../../store/board-context";
import classes from "./index.module.css";

const InviteModal = () => {
    const { shareInvite, setShareInvite, socket } = useContext(boardContext);

    if (!shareInvite) return null;

    const handleResponse = (response) => {
        if (socket) {
            socket.emit("respondToInvite", {
                canvasId: shareInvite.canvasId,
                inviterId: shareInvite.inviterId,
                response: response
            });
        }
        setShareInvite(null);
    };

    return (
        <div className={classes.overlay}>
            <div className={classes.modal}>
                <h3>Canvas Invitation</h3>
                <p><strong>{shareInvite.inviterEmail}</strong> has invited you to collaborate on a canvas.</p>
                <div className={classes.actions}>
                    <button className={classes.acceptBtn} onClick={() => handleResponse("accepted")}>Accept</button>
                    <button className={classes.rejectBtn} onClick={() => handleResponse("rejected")}>Reject</button>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;
