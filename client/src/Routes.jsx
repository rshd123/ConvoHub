import React,{useEffect} from "react";
import {useNavigate, useRoutes} from "react-router-dom";
import {Chat} from './Chat.jsx';
import {useAuth} from './AuthContext.jsx';
import Login from "./Components/auth/Login.jsx";
import Signup from "./Components/auth/Signup.jsx";
export default function Routes(){
    const { currentUser,setCurrentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(()=>{
        const userIdfromLocalStorage = localStorage.getItem('userId');
        if(!currentUser && userIdfromLocalStorage){
            setCurrentUser(userIdfromLocalStorage);
        }
        if(!userIdfromLocalStorage && !["/login","/signup"].includes(window.location.pathname)){ 
            navigate('/signup');
        }

        if(userIdfromLocalStorage){
            navigate('/');
        }
    },[currentUser,setCurrentUser]);

    let elements = useRoutes([
        {
            path:'/',
            element: <Chat />
        },
        {
            path:'/login',
            element: <Login />
        },
        {
            path:'/signup',
            element: <Signup />
        },
    ]);

    return elements;
};