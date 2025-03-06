import user from "../Model/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const signUp = async (req,res)=>{
    const {username,email,password} = req.body;
    if(!username || !password || !email){
        return res.staus(400).json({message:"Please enter all fields"});
    }
    try {
        const User = await user.findOne({username});
        if(User){
            return res.status(400).json({message:"User already exists"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        let newUser = new user({
            username:username,
            email: email,
            password: hashedPassword,
        })
        await newUser.save();
        const result = user.findOne({username});
        //creating json web token activated for an hour
        const token = jwt.sign({id: result._id},process.env.JWT_SECRET_KEY, {expiresIn: "1h"}); 
        return res.status(201).json({message:"User created successfully",token, userId: result._id, username: result.username});

        
    } catch (err) {
        console.error(err);
    }
};

export const login = async (req,res)=>{
    const {username, password} = req.body;
    if(!username || !password){
        return res.staus(400).json({message:"Please enter all fields"});
    }
    try {
        const User = await user.findOne({username});
        if(!User){
            return res.status(400).json({message:"User does not exist"});
        }

        const match = await bcrypt.compare(password,User.password);
        if(!match){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const token = jwt.sign({id: User._id},process.env.JWT_SECRET_KEY, {expiresIn: "1h"});
        return res.status(200).json({message:"User Logged in successfully",token, userId:User._id,username: User.username});
    } catch (err) {
        console.error(err);
    }
}