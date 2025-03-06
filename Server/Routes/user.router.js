import express from 'express';
import mongoose from 'mongoose';
const userRouter = express.Router();
import { signUp, login} from '../controllers/userController.js';

userRouter.post('/user/login',login)

userRouter.post('/user/signup',signUp);

export default userRouter;

