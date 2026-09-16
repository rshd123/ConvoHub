<div align="center">

# ConvoHub

### Real-time Chat with End-to-End Encrypted File Sharing

A full-stack chat application that supports instant messaging and secure peer-to-peer file sharing, built on WebSockets with AES-256-GCM encryption.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-4.8-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.10-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![AWS S3](https://img.shields.io/badge/AWS_S3-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![Material UI](https://img.shields.io/badge/Material_UI-6.3-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)]()

---

</div>

## Features

- **Real-time Messaging** -- Send and receive messages instantly via WebSocket connections.
- **Encrypted File Sharing** -- Files are encrypted client-side with AES-256-GCM before upload.
- **User Presence** -- Live display of active users in the chat room.
- **Join/Leave Notifications** -- Automatic alerts when users enter or exit a chat room.
- **Secure Connections** -- All data transfers occur over encrypted WebSocket channels.
- **Cross-Browser Support** -- Works seamlessly across all modern browsers.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|:--|:--|
| React 18 | UI component library |
| Vite | Build tool and dev server |
| Material UI 6 | Component library and styling |
| Socket.IO Client | Real-time WebSocket communication |
| Axios | HTTP client for API requests |
| React Router 7 | Client-side routing |

### Backend

| Technology | Purpose |
|:--|:--|
| Node.js | JavaScript runtime |
| Express 4 | HTTP server framework |
| Socket.IO 4 | WebSocket server |
| MongoDB + Mongoose | Database and ODM |
| AWS SDK (S3) | Cloud file storage |
| Multer | Multipart file upload handling |
| bcryptjs | Password hashing |
| JSON Web Token | Authentication tokens |
| dotenv | Environment variable management |

---

## Architecture

```
ConvoHub/
|-- client/                  # React frontend (Vite)
|   |-- src/
|       |-- AuthContext.jsx          # Authentication state management
|       |-- Chat.jsx                 # Main chat interface
|       |-- Components/
|       |   |-- messages/
|       |       |-- Messages.jsx     # Message rendering
|       |-- utils/
|           |-- encryption.js        # AES-256-GCM client-side encryption
|
|-- Server/                  # Node.js backend
    |-- config/
    |   |-- s3config.js              # AWS S3 client configuration
    |-- Routes/
    |   |-- file.router.js           # File upload/download endpoints
    |-- controllers/
    |   |-- fileController.js        # File handling logic
    |-- server.js                    # Express + Socket.IO entry point
```

---

## Encrypted File Sharing

ConvoHub uses **AES-256-GCM symmetric encryption** to secure file sharing between users. All files are encrypted directly in the browser before being uploaded, ensuring that no plaintext data or keys ever leave the user's device.

### How It Works

1. A shared **conversation key** is established among all participants in a chat.
2. When a user selects a file, a unique **12-byte IV (Initialization Vector)** is generated.
3. The file is encrypted **client-side** using the conversation key and IV.
4. Only the **ciphertext** (encrypted data) is uploaded to **Amazon S3**.
5. On download, the same key and IV are used to decrypt the file in the browser.

### Encryption Details

- **Algorithm:** AES-256-GCM (Advanced Encryption Standard, Galois/Counter Mode)
- **Key Length:** 256-bit shared conversation key
- **IV:** Fresh random 12-byte vector per file
- **Integrity:** GCM provides built-in authentication tag for tamper detection
- **Storage:** Only encrypted ciphertext is stored in S3 -- no plaintext ever reaches the server
- **Download:** Files are served via `/download/:key` backend proxy to prevent direct S3 access and avoid CORS issues

### Key Concept

All users in the same conversation share one secret key (the "conversation key"). This means:

- Any member of the chat can encrypt a file for the group.
- Only members who possess the conversation key can decrypt the file.
- The server and S3 never have access to the plaintext or the key.

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- AWS S3 bucket with access credentials
- npm or yarn

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/rshd123/ConvoHub.git
cd ConvoHub
```

**2. Install server dependencies**

```bash
cd Server
npm install
```

**3. Install client dependencies**

```bash
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in the `Server/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket_name
```

### Running the Application

**Start the backend:**

```bash
cd Server
npm start
```

**Start the frontend (in a separate terminal):**

```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the ISC License.
