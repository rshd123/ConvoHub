import React, { useEffect, useRef } from "react";
import TypingIndicator from "../TypingIndicator.jsx";
import { Button } from "@mui/material";
import { Download } from "@mui/icons-material";

const Messages = ((props) => {
    const messagesEndRef = useRef(null);

    // const scrollToBottom = () => {
    //     if (messagesEndRef.current) {
    //         messagesEndRef.current.scrollTop({ behavior: "smooth", block: "end" });
    //     }
    // };

    const scrollToBottom = () => {
        const container = document.querySelector(".container");
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    };

    useEffect(() => {
        // Add a small delay to ensure DOM is updated
        const timeoutId = setTimeout(() => {
            scrollToBottom();
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [props.messages, props.typingUsers]);

    return (
        <div className="divContainer">
            <div className="userList">
                <b style={{textDecorationLine:'underline'}}><i>Active-Users:</i></b><br/><br />
                {props.users.map((user,idx)=>(
                    <div key={idx}>{user}</div>
                ))}
            </div>            <div className="container" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flexGrow: 1 }}>
                    {props.messages.map((data, index) => (
                        <div key={index} className={`msg ${data.position}`}>
                            <b>{data.user}</b>: {data.message}
                            {/* Show download button if message has file data */}
                            {data.fileData && props.onDownloadFile && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<Download />}
                                        onClick={() => props.onDownloadFile(data.fileData)}
                                        style={{
                                            borderRadius: '20px',
                                            textTransform: 'none',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Download
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    <TypingIndicator users={props.typingUsers || []} />
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
});

export default Messages;