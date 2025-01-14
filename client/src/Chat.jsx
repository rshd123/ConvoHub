import React,{useState,useEffect, useRef} from "react";
import Navbar from "./Components/Navbar";
import Messages from "./Components/Messages";
import { Button,TextField } from "@mui/material";
import io from 'socket.io-client';

const server_url = "http://localhost:3000";


export default function Chat(){
    let socketRef = useRef();
    const [username, setUsername] = useState('');
    const [userAvailable, setUserAvailable] = useState(false);

    const [messages,setMessages] = useState([]);
    const [message,setMessage] = useState([]);
    const [users, setUsers] = useState([]);

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url);

        socketRef.current.emit('new-user-joined',username);

        socketRef.current.on('user-joined', username=>{
            setMessages((prevMessages)=>{
                const updatedMessages = [...prevMessages,{ user: username, message: 'has joined the chat', position: 'left'}];
                return updatedMessages;
            })
        })

        socketRef.current.on('recieve', data=>{
            setMessages((prevMessages)=>{
                const updatedMessages = [...prevMessages, { user: data.user, message: data.message, position: 'left'}];
                return updatedMessages;
            })
        })
        socketRef.current.on('usersList',users=>{
            console.log(Object.values(users));
            let userList = Object.values(users);
            setUsers((prevUsers)=>{
                // Merge new users into the current list and remove duplicates
                const updatedUsers = Array.from(new Set([...prevUsers, ...userList]));
                return updatedUsers;  
            })
        })

        socketRef.current.on('user-left', user=>{
            console.log(users);
            setMessages((prevMessages)=>{
                const updatedMessages = [...prevMessages, { user: user, message: 'left the chat', position: 'left'}];
                return updatedMessages;
            })
            setUsers((prevUsers)=>{
                const updatedUsers = prevUsers.filter((username)=> username != user);
                return updatedUsers;
            })
        })
    };

    const handleSubmit= (e)=>{
        e.preventDefault();
        localStorage.setItem('username', username);
        setUserAvailable(true);
        connectToSocketServer();
    }    


    const handleLeaveChat = ()=>{
        setUserAvailable(false);
        localStorage.removeItem('username');
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null; // Cleanup the socket reference
        }
    }

    const handleMessageSubmit = (e)=>{
        e.preventDefault();
        setMessages((prevMessages)=>{
            const updatedMessages = [...prevMessages, { user: username, message: message, position: 'right'}];
            return updatedMessages;
        })
        socketRef.current.emit('send',message);
        setMessage('');
    }

    return (
        userAvailable === false ? 

        <div>
            <Navbar/>

            <form onSubmit={handleSubmit} className="usernameForm">
                <input 
                    type="text" 
                    placeholder="Enter username" 
                    onChange={(e) => setUsername(e.target.value)}   
                    value={username}
                    className="userName"
                />
                <Button 
                    className="usernameBtn"
                    type="submit"
                >Done</Button>
            </form>
        </div>
        :
        <div>
            <Navbar/>
            <Messages messages={messages} users={users}/>
            <form className="send-container" onSubmit={handleMessageSubmit}>
                <TextField
                    placeholder="type..."
                    id="outlined-multiline-flexible"
                    name="messageInp"
                    className="messageInp"
                    style={{marginRight:'1rem'}}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '20px', // Rounded corners
                          lineHeight: '2',      // Adjust line-height
                          height:'40px',
                          padding:'10px',
                        },
                        '& .MuiOutlinedInput-input': {
                          lineHeight: '1',    // Line height for the input text
                          padding: '0px',
                        },
                    }}
                    onChange={(e)=> setMessage(e.target.value   )}
                    value={message}
                    autoComplete="off"
                />
                <Button 
                    type="submit" 
                    variant="outlined" 
                    className="submitButton" 
                    style={{
                        border:'1px solid black',
                        color: 'black'
                    }}
                >Send</Button>
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