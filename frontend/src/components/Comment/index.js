import React from "react";
import classes from "./index.module.css";

const Comment = ({ x, y, text, author, createdAt }) => {
    return (
        <div className={classes.commentContainer} style={{ left: x, top: y }}>
            {author && <div className={classes.author}>{author}</div>}
            <div className={classes.text}>{text}</div>
            <div className={classes.timestamp}>
                {new Date(createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </div>
        </div>
    );
};

export default Comment;
