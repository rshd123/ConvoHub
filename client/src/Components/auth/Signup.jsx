import React, { useEffect,useState } from "react";
import { useAuth } from "../../AuthContext.jsx";
import axios from "axios";
import { PageHeader } from "@primer/react";
import { Box, Button } from "@primer/react";
import { useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";
// import dotenv from "dotenv";
// dotenv.config();

export default function SignUp() {
    const [email, setEmail] = useState("");
    const [username,setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { setCurrentUser } = useAuth();
    const [error, setError] = useState(null);
    const handleSignup = async (e)=>{
        e.preventDefault();
        try {
            setLoading(true);
            const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/user/signup`,{
                username,
                email,
                password
            });

            console.log(response);
            localStorage.setItem("token",response.data.token);
            localStorage.setItem("userId",response.data.userId);
            localStorage.setItem("username",response.data.username);

            setCurrentUser(response.data.userId);

            window.location.href = "/";

        } catch (err) {
            setLoading(false);
            setError(err.response.data.message);
            console.error('Error signing up: ',err.response.data.message);
        }
    }
    return (
        <div className="login-wrapper">
            <div className="login-box-wrapper">
                <div className="login-heading">
                    {error && <p className="error" style={{color:'red'}}>{error}</p>}
                    {!error && 
                    <Box sx={{ padding: 1 }}>
                        <PageHeader>
                            <PageHeader.TitleArea variant="large">
                                <PageHeader.Title>Sign Up</PageHeader.Title>
                            </PageHeader.TitleArea>
                        </PageHeader>
                        </Box>  
                    }
                </div>
                <div className="login-box">
                    <div>
                        <label className="label">Username</label>
                        <input
                            autoComplete="off"
                            name="Username"
                            id="Username"
                            className="input"
                            type="text"
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                        />
                    </div>

                    <div>
                        <label className="label">Email address</label>
                        <input
                            autoComplete="off"
                            name="Email"
                            id="Email"
                            className="input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="div">
                        <label className="label">Password</label>
                        <input
                            autoComplete="off"
                            name="Password"
                            id="Password"
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="primary"
                        className="login-btn"
                        disabled={loading}
                        onClick={handleSignup}
                    >
                        {loading ? "Signing Up..." : "Signup"}
                    </Button>
                </div>

                <div className="pass-box">
                    <p>
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}