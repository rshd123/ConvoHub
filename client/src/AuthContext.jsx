import React, { useEffect, useState, useContext, createContext } from "react";
import { EncryptionManager } from './utils/encryption.js';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext)
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [encryptionKey, setEncryptionKey] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            let userId = localStorage.getItem('userId');
            let username = localStorage.getItem('username');
            let token = localStorage.getItem('token');

            if (userId) {
                setCurrentUser(userId);
            }
            
            // Always load the conversation key (even if no userId)
            await loadOrGenerateConversationKey();
            
        } catch (error) {
            console.error('Auth initialization failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadOrGenerateConversationKey = async () => {
        try {
            console.log('🔑 Initializing conversation key...');
            
            // Use a FIXED shared conversation key for all users (for testing/demo)
            // This is a valid Base64-encoded 256-bit (32 bytes) key
            // Generated once and hardcoded so all users share the same key
            const SHARED_KEY_STRING = 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY='; // 32 bytes base64
            
            const conversationId = 'convohub-main-chat';
            
            // Always use the fixed shared key (don't rely on localStorage for consistency)
            localStorage.setItem(`conversationKey_${conversationId}`, SHARED_KEY_STRING);
            console.log('✅ Using fixed shared key');
            console.log('🔑 Key string (first 20 chars):', SHARED_KEY_STRING.substring(0, 20));

            // Import the key
            const key = await EncryptionManager.importKey(SHARED_KEY_STRING);
            setEncryptionKey(key);
            console.log('✅ Conversation key imported successfully');
            console.log('  - Key type:', key.type);
            console.log('  - Algorithm:', key.algorithm.name);
            console.log('  - Usages:', key.usages);
            
        } catch (error) {
            console.error('❌ Conversation key management failed:', error);
            console.error('  - Error name:', error.name);
            console.error('  - Error message:', error.message);
            console.error('  - Error stack:', error.stack);
        }
    };

    const value = { 
        currentUser, 
        setCurrentUser, 
        encryptionKey, 
        isLoading 
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}