import React, {useEffect, useState, useContext, createContext, Children} from "react";

const AuthContext = createContext();
export const useAuth = () => {
    return useContext(AuthContext)
};

export const AuthProvider = ({children})=>{
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
        let userId = localStorage.getItem('userId');
        if (userId) {
            setCurrentUser(userId);
        }
    }, []);

    const value = { currentUser, setCurrentUser };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}