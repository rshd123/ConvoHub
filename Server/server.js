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
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const users = {};

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", userRouter);

const dbConnect = async () => {
  await mongoose.connect(process.env.MONGO_URL);
};
dbConnect()
  .then(() => {
    console.log('Database Connected');
  })
  .catch((err) => {
    console.log('Cannot connect to database' + err);
  })


io.on('connection', (socket) => {

  socket.on('new-user-joined', (username) => {
    if (username) {
      console.log(`${username} connected`);
      users[socket.id] = username;
      socket.broadcast.emit('user-joined', username);

      socket.broadcast.emit('usersList', users);
      socket.emit('usersList', users);
    }
  });

  socket.on('send', (message) => {
    socket.broadcast.emit('receive', { message: message, user: users[socket.id] });
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      console.log(`${users[socket.id]} left`);
      socket.broadcast.emit('user-left', users[socket.id]);
      delete users[socket.id];
    }
  });
});

// Start the Express server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on....`);
});
