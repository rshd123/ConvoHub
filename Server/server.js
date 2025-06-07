import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import userRouter from './Routes/user.router.js';
import bodyParser from 'body-parser';

const app = express();
const server = createServer(app);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const users = new Map(); // Better performance than an object

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', userRouter);

const dbConnect = async () => {
  try {
    
    await mongoose.connect(process.env.MONGO_URL, {});
    console.log('✅ Database Connected');
  } catch (err) {
    console.error('❌ Cannot connect to database:', err);
    process.exit(1); 
  }
};

dbConnect();

io.on('connection', (socket) => {
  socket.on('new-user-joined', (username) => {
    if (username) {
      console.log(`👤 ${username} connected`);
      users.set(socket.id, username);
      socket.broadcast.emit('user-joined', username);
      
      // Send updated user list
      io.emit('usersList', Array.from(users.values()));
    }
  });

  socket.on('send', (message) => {
    if (users.has(socket.id)) {
      socket.broadcast.emit('receive', {
        message,
        user: users.get(socket.id),
      });
    }
  });

  socket.on('disconnect', () => {
    if (users.has(socket.id)) {
      console.log(`❌ ${users.get(socket.id)} left`);
      socket.broadcast.emit('user-left', users.get(socket.id));
      users.delete(socket.id);
      
      // Send updated user list
      io.emit('usersList', Array.from(users.values()));
    }
  });
});
