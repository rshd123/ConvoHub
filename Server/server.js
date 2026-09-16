import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import multer from 'multer';
import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';
dotenv.config();

import userRouter from './Routes/user.router.js';
import bodyParser from 'body-parser';

const app = express();
const server = createServer(app);

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

// Configure multer for memory storage (for S3 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});

const io = new Server(server, {
  cors: {
    // origin: 'https://convohub-k3t8.onrender.com',
    origin: 'http://localhost:5173', 
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const users = new Map(); // Better performance than an object

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', userRouter);

// Middleware to extract username from token
const extractUsername = (req, res, next) => {
  try {
    console.log('🔍 Extracting username...');
    console.log('  - Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('  - x-username header:', req.headers['x-username']);
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.username = decoded.username;
      console.log('  ✅ Username from token:', req.username);
    } else {
      // Fallback: try to get username from localStorage (sent in header)
      req.username = req.headers['x-username'] || 'anonymous';
      console.log('  ⚠️ Username from header fallback:', req.username);
    }
    next();
  } catch (error) {
    console.log('  ❌ Token verification failed:', error.message);
    req.username = req.headers['x-username'] || 'anonymous';
    console.log('  ⚠️ Using fallback username:', req.username);
    next();
  }
};

// File upload endpoint with AWS S3 and username-based folders
app.post('/upload', extractUsername, upload.single('file'), async (req, res) => {
  try {
    console.log('📁 Upload request received from user:', req.username);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const metadata = JSON.parse(req.body.metadata);
    const timestamp = Date.now();
    const username = req.username || 'anonymous';
    
    // Create S3 key with username folder structure
    const key = `convohub-files/${username}/encrypted-${timestamp}-${req.file.originalname}`;
    
    console.log('📂 Uploading to S3 path:', key);

    // Upload to S3 (without ACL - bucket has ACLs disabled)
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: 'application/octet-stream',
      Metadata: {
        originalName: metadata.originalName,
        originalType: metadata.originalType,
        originalSize: metadata.originalSize.toString(),
        iv: JSON.stringify(metadata.iv),
        encrypted: 'true',
        uploadedBy: username,
        uploadedAt: new Date().toISOString()
      }
    };

    const result = await s3.upload(uploadParams).promise();
    
    console.log('✅ File uploaded successfully to S3:', result.Key);
    
    // Generate proxy download URL through our server (bypasses CORS)
    // Don't encode the key - the route :key(*) captures everything including slashes
    const downloadUrl = `http://localhost:${PORT}/download/${result.Key}`;
    
    console.log('🔗 Download proxy URL generated:', downloadUrl);

    res.json({
      success: true,
      fileUrl: downloadUrl, // Use server proxy URL instead of direct S3 URL
      key: result.Key,
      metadata: {
        ...metadata,
        uploadedBy: username,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ S3 Upload error:', error);
    res.status(500).json({ error: 'File upload failed: ' + error.message });
  }
});

// Download proxy endpoint - bypasses CORS issues
app.get('/download/:key(*)', async (req, res) => {
  try {
    const key = req.params.key;
    console.log('📥 Download request for:', key);

    // Get object from S3
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };

    const s3Stream = s3.getObject(params).createReadStream();
    
    // Set headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Pipe S3 stream directly to response
    s3Stream.pipe(res);
    
    s3Stream.on('error', (error) => {
      console.error('❌ S3 stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed: ' + error.message });
      }
    });

    console.log('✅ File streaming to client');

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ error: 'Download failed: ' + error.message });
  }
});

// Optional: Endpoint to list user's files
app.get('/files/:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    const listParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: `convohub-files/${username}/`
    };

    const result = await s3.listObjectsV2(listParams).promise();
    
    // Generate presigned URLs for each file
    const files = result.Contents.map(file => {
      const signedUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: file.Key,
        Expires: 3600 // 1 hour
      });
      
      return {
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        url: signedUrl // Presigned URL instead of direct S3 URL
      };
    });

    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

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

  socket.on('typing', (username) => {
    socket.broadcast.emit('user-typing', username);
  });

  socket.on('stop-typing', (username) => {
    socket.broadcast.emit('user-stop-typing', username);
  });
  
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

  socket.on('share-encrypted-file', (fileData) => {
    if (users.has(socket.id)) {
      console.log(`📎 ${users.get(socket.id)} shared encrypted file: ${fileData.filename} stored in S3`);
      socket.broadcast.emit('encrypted-file-shared', {
        ...fileData,
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
