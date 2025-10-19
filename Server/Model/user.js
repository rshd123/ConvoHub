import mongoose from "mongoose";
import { Schema } from "mongoose";
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique:true,
    },
    password: {
        type: String,
        required: true,
    }
});

const user = mongoose.model('user', userSchema);
export default user;