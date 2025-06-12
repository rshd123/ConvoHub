import React, { useState, useEffect, useRef } from "react";
import Navbar from "./Components/navbar/Navbar";
import Messages from "./Components/messages/Messages";
import { Button, TextField } from "@mui/material";
import io from 'socket.io-client';

const server_url = import.meta.env.VITE_SERVER_URL;
// console.log("Server URL:", server_url);


export function Chat() {


    let socketRef = useRef();
    const [username, setUsername] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);


    useEffect(() => {
        setUsername(localStorage.getItem('username'));
        connectToSocketServer();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect(); // Cleanup on unmount
            }
        };
    }, [username]);

    useEffect(() => {
        // ...existing code...

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [username]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setMessage(value);

        // Clear any existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Emit typing event if not already typing
        socketRef.current.emit('typing', username);

        // Set timeout to stop typing indicator after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current.emit('stop-typing', username);
        }, 999);
    };


    const connectToSocketServer = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();  // Ensure only one connection
        }



        socketRef.current = io.connect(server_url);
        socketRef.current.emit('new-user-joined', username);

        // Remove any previous listeners before adding new ones
        socketRef.current.off('user-joined');
        socketRef.current.off('receive');
        socketRef.current.off('usersList');
        socketRef.current.off('user-left');

        socketRef.current.on('user-joined', (username) => {
            setMessages(prevMessages => [
                ...prevMessages, { user: username, message: 'has joined the chat', position: 'left' }
            ]);
        });

        socketRef.current.on('receive', (data) => {
            setMessages(prevMessages => [
                ...prevMessages, { user: data.user, message: data.message, position: 'left' }
            ]);
        });

        socketRef.current.on('usersList', (users) => {
            setUsers(Object.values(users));
        });

        socketRef.current.on('user-left', (user) => {
            setMessages(prevMessages => [
                ...prevMessages, { user: user, message: 'left the chat', position: 'left' }
            ]);
            setUsers(prevUsers => prevUsers.filter((username) => username !== user));
        });

        socketRef.current.off('user-typing');
        socketRef.current.off('user-stop-typing');

        // Add new listeners
        socketRef.current.on('user-typing', (username) => {
            setTypingUsers(prev => {
                if (!prev.includes(username)) {
                    return [...prev, username];
                }
                return prev;
            });
        });

        socketRef.current.on('user-stop-typing', (username) => {
            setTypingUsers(prev => prev.filter(user => user !== username));
        });
    };




    const handleLeaveChat = () => {
        localStorage.removeItem('username');
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null; // Cleanup the socket reference
        }
        window.location.reload();
    }
    const handleMessageSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) return; // Prevent empty messages
        socketRef.current.emit('send', message);
        setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, { user: username, message: message, position: 'right' }];
            return updatedMessages;
        });
        setMessage('');
    }    
    return (
        <div>
            <Navbar />
            <Messages messages={messages} users={users} typingUsers={typingUsers} />
            <form className="send-container" onSubmit={handleMessageSubmit}>
                <TextField
                    placeholder="type..."
                    id="outlined-multiline-flexible"
                    name="messageInp"
                    className="messageInp"
                    style={{ marginRight: '1rem' }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '20px', // Rounded corners
                            lineHeight: '2',      // Adjust line-height
                            height: '40px',
                            padding: '10px',
                        },
                        '& .MuiOutlinedInput-input': {
                            lineHeight: '1',    // Line height for the input text
                            padding: '0px',
                        },
                    }}
                    onChange={handleInputChange}
                    value={message}
                    autoComplete="off"
                />
                <Button
                    type="submit"
                    variant="outlined"
                    className="submitButton"
                    style={{
                        border: '1px solid black',
                        color: 'black',
                       
                    }}
                ><i className="fa-solid fa-paper-plane"></i></Button>
                <Button
                    onClick={handleLeaveChat}
                    variant="outlined"
                    color="error"
                    className="leaveBtn"
                >Leave Chat</Button>
            </form>
        </div>
    );
}