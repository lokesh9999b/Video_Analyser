# 🎬 Pulse Video Platform

Pulse is an enterprise-ready, multi-tenant video processing and moderation platform. It allows organizations to securely upload, encode, stream, and manage their video content with built-in Role-Based Access Control (RBAC) and automated content moderation.

## ✨ Key Features

* **Multi-Tenant Architecture:** Complete data isolation using `organisation` as the tenant boundary. Users only see videos within their workspace.
* **Role-Based Access Control (RBAC):**
  * **Viewers:** Read-only access to assigned videos.
  * **Editors:** Can upload, edit, and delete their own video content.
  * **Admins:** Full system access, including cross-organization video management and user role administration.
* **Real-time Video Processing Pipeline:**
  * Automated file validation and size constraints.
  * FFmpeg-powered frame extraction and encoding.
  * Real-time WebSocket (`Socket.io`) progress updates streamed directly to the frontend.
* **Secure Streaming:** JWT-authenticated video streaming endpoints protecting raw media files.
* **Modern SaaS UI:** Built with React, Tailwind CSS v4, and Lucide Icons featuring a premium, dark-mode, glassmorphic aesthetic.

## 🚀 Tech Stack

**Frontend:**
- React 19 (Vite)
- Tailwind CSS v4
- Socket.io Client
- React Router DOM
- Axios

**Backend:**
- Node.js & Express
- MongoDB (Mongoose)
- Socket.io (WebSocket server)
- FFmpeg (Video processing)
- JSON Web Tokens (JWT) for authentication
- Multer (File uploads)

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (or local instance)
- FFmpeg installed and available in your system's PATH

### 1. Clone the repository
```bash
git clone https://github.com/lokesh9999b/Video_Analyser.git
cd Video_Analyser
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5174
MAX_FILE_SIZE_MB=500
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
Start the frontend server:
```bash
npm run dev
```

## 🔐 First Admin Account
The **first user** to register a new organization automatically receives the `admin` role. All subsequent users who join that organization will default to the `editor` role until an admin upgrades them.

## 📄 License
This project is proprietary and confidential.
