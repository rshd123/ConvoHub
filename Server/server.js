import { Server } from 'socket.io';

const users = {}; 

const io = new Server(3000, {
  cors: {
    origin: "*", // Allow all origins (for CORS)
  },
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('new-user-joined', (username) => {
    console.log(`${username} connected`);
    users[socket.id] = username; 
    socket.broadcast.emit('user-joined', username);

    socket.broadcast.emit('usersList',users) ;
    socket.emit('usersList',users) ;
  });

  
  socket.on('send', (message) => {
    socket.broadcast.emit('recieve', {message: message, user: users[socket.id] }); 
  });

  socket.on('disconnect', () => {
    console.log(`${users[socket.id]} left`);
    socket.broadcast.emit('user-left', users[socket.id]); 
    delete users[socket.id]; 
  });
});
