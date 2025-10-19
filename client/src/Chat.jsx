import React, { useState, useEffect, useRef } from "react";
import Navbar from "./Components/navbar/Navbar";
import Messages from "./Components/messages/Messages";
import { Button, TextField, IconButton, CircularProgress } from "@mui/material";
import { AttachFile } from "@mui/icons-material";
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { EncryptionManager } from './utils/encryption';

const server_url = import.meta.env.VITE_SERVER_URL;
// console.log("Server URL:", server_url);


export function Chat() {
    const { encryptionKey } = useAuth();

    let socketRef = useRef();
    const [username, setUsername] = useState('');
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    // Debug: Check encryption key
    useEffect(() => {
        console.log('🔐 Encryption Key Status:', encryptionKey ? 'Available ✅' : 'Not Available ❌');
        if (encryptionKey) {
            console.log('  - Key type:', encryptionKey.type);
            console.log('  - Algorithm:', encryptionKey.algorithm?.name);
        }
    }, [encryptionKey]);


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
        socketRef.current.off('encrypted-file-shared');

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

        socketRef.current.on('encrypted-file-shared', (data) => {
            setMessages(prevMessages => [
                ...prevMessages, { 
                    user: data.user, 
                    message: `� Shared encrypted file: ${data.filename}`,
                    position: 'left',
                    fileData: data
                }
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
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                alert('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
            console.log('File selected:', file.name);
        }
    };

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    const uploadEncryptedFile = async (encryptedData, metadata) => {
        try {
            const formData = new FormData();
            
            // Create blob from encrypted data
            const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
            formData.append('file', encryptedBlob, `encrypted_${metadata.originalName}`);
            formData.append('metadata', JSON.stringify(metadata));

            // Get username from localStorage
            const username = localStorage.getItem('username') || 'anonymous';
            const token = localStorage.getItem('token');
            
            console.log('📤 Uploading file...');
            console.log('  - Username:', username);
            console.log('  - Token:', token ? 'Present' : 'Missing');

            const response = await axios.post(`${server_url}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                    'x-username': username // Send username in header as fallback
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            return response.data;
        } catch (error) {
            console.error('Upload failed:', error);
            throw new Error('File upload failed');
        }
    };

    const handleDownloadFile = async (fileData) => {
        if (!encryptionKey) {
            alert('Encryption key not available. Cannot decrypt file.');
            return;
        }

        try {
            console.log('📥 Downloading file:', fileData.filename);
            console.log('🔗 Download URL:', fileData.url);
            console.log('🔑 IV:', fileData.iv);
            console.log('📦 File type:', fileData.type);
            console.log('🔐 Encryption key available:', !!encryptionKey);
            setUploadProgress(0);

            // Download encrypted file through our server proxy (bypasses CORS)
            const response = await fetch(fileData.url, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Download failed: HTTP ${response.status} - ${response.statusText}`);
            }

            setUploadProgress(50);
            console.log('✅ File downloaded from server');

            // Convert response to ArrayBuffer
            const encryptedData = await response.arrayBuffer();
            console.log('📊 Encrypted data size:', encryptedData.byteLength);
            
            setUploadProgress(70);
            console.log('✅ File data received, decrypting...');
            console.log('🔑 Decryption params:', {
                ivLength: fileData.iv?.length,
                ivType: typeof fileData.iv,
                ivIsArray: Array.isArray(fileData.iv),
                encryptedDataType: encryptedData.constructor.name
            });

            // Decrypt the file using shared conversation key
            const decryptedBlob = await EncryptionManager.decryptFile(
                encryptedData,
                fileData.iv,
                encryptionKey,
                fileData.type
            );

            setUploadProgress(90);
            console.log('✅ File decrypted successfully');

            // Auto-download to user's device
            const url = URL.createObjectURL(decryptedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileData.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setUploadProgress(100);
            console.log('✅ File saved to device:', fileData.filename);

            setTimeout(() => setUploadProgress(null), 1500);

        } catch (error) {
            console.error('❌ Download/decrypt failed:', error);
            console.error('❌ Error name:', error.name);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            alert(`Failed to download file: ${error.message}\n\nPlease check console for details.`);
            setUploadProgress(null);
        }
    };

    const handleMessageSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() && !selectedFile) return; // Prevent empty messages
        
        // Handle encrypted file upload
        if (selectedFile && encryptionKey) {
            try {
                setUploadProgress(0);
                
                // Step 1: Encrypt the file
                setUploadProgress(10);
                const encryptedFileData = await EncryptionManager.encryptFile(selectedFile, encryptionKey);
                
                // Step 2: Upload encrypted file
                setUploadProgress(20);
                const uploadResult = await uploadEncryptedFile(encryptedFileData.encryptedData, {
                    originalName: encryptedFileData.originalName,
                    originalType: encryptedFileData.originalType,
                    originalSize: encryptedFileData.originalSize,
                    iv: encryptedFileData.iv,
                    encrypted: true
                });

                console.log('📤 Upload result:', uploadResult);
                console.log('🔗 File URL:', uploadResult.fileUrl);

                setUploadProgress(100);

                // Step 3: Emit to other users via Socket.IO
                const fileShareData = {
                    url: uploadResult.fileUrl,
                    filename: encryptedFileData.originalName,
                    iv: encryptedFileData.iv,
                    size: encryptedFileData.originalSize,
                    type: encryptedFileData.originalType,
                    encrypted: true
                };

                console.log('📡 Sharing file data via Socket.IO:', fileShareData);

                socketRef.current.emit('share-encrypted-file', fileShareData);

                // Step 4: Update local messages
                setMessages((prevMessages) => [
                    ...prevMessages, { 
                        user: username, 
                        message: `📎 Shared encrypted file: ${encryptedFileData.originalName}`, 
                        position: 'right',
                        fileData: fileShareData
                    }
                ]);

                setSelectedFile(null);
                setUploadProgress(null);
                
            } catch (error) {
                console.error('Encrypted file upload failed:', error);
                alert('File upload failed: ' + error.message);
                setUploadProgress(null);
            }
        }
        
        // Handle text message
        if (message.trim()) {
            socketRef.current.emit('send', message);
            setMessages((prevMessages) => [
                ...prevMessages, { user: username, message: message, position: 'right' }
            ]);
        }
        
        setMessage('');
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }    
    return (
        <div>
            <Navbar />
            <Messages 
                messages={messages} 
                users={users} 
                typingUsers={typingUsers}
                onDownloadFile={handleDownloadFile}
            />
            <form className="send-container" onSubmit={handleMessageSubmit}>
                <div style={{ display: 'flex', gap: '0.5rem'}}>
                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    />
                    
                    {/* Attachment button */}
                    <IconButton
                        onClick={handleAttachmentClick}
                        className="attachmentBtn"
                        style={{
                            color: encryptionKey ? '#4CAF50' : '#666',
                            padding: '8px',
                            
                        }}
                        title={encryptionKey ? "Attach encrypted file" : "Encryption not available"}
                        disabled={!encryptionKey || uploadProgress !== null}
                    >
                        <AttachFile />
                    </IconButton>
                    
                    {uploadProgress !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CircularProgress size={20} variant="determinate" value={uploadProgress} />
                            <span style={{ fontSize: '12px' }}>
                                {uploadProgress < 20 ? 'Encrypting...' : 
                                 uploadProgress < 100 ? 'Uploading...' : 'Complete ✅'}
                            </span>
                        </div>
                    )}
                    
                    {/* Text input */}
                    <TextField
                        placeholder={
                            selectedFile ? `� File selected: ${selectedFile.name}` : 
                            uploadProgress !== null ? "Processing file..." : 
                            "type..."
                        }
                        id="outlined-multiline-flexible"
                        name="messageInp"
                        className="messageInp"
                        style={{ flex: 1 }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '20px', // Rounded corners
                                lineHeight: '2',      // Adjust line-height
                                height: '40px',
                                padding: '10px',
                                width:'300px'
                            },
                            '& .MuiOutlinedInput-input': {
                                lineHeight: '1',    // Line height for the input text
                                padding: '0px',
                            },
                        }}
                        onChange={handleInputChange}
                        value={message}
                        autoComplete="off"
                        disabled={uploadProgress !== null}
                    />
                </div>
                
                <Button
                    type="submit"
                    variant="outlined"
                    className="submitButton"
                    style={{
                        border: '1px solid black',
                        color: 'black',
                        marginLeft: '1rem'
                    }}
                    disabled={uploadProgress !== null}
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