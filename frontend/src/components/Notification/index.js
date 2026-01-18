import React, { useEffect } from "react";
import classes from "./index.module.css";

const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`${classes.notification} ${classes[type]}`}>
            <span className={classes.icon}>🔔</span>
            <span className={classes.message}>{message}</span>
            <button className={classes.close} onClick={onClose}>✕</button>
        </div>
    );
};

export default Notification;
