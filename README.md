# 🔁 EchoShare

EchoShare is a lightweight, login-free web application for real-time text and small file sharing using temporary rooms.

Users can create or join rooms via short sharing codes to exchange data anonymously, with no data stored on the server or in a database.

## 🚀 Features
- Login-free and anonymous usage
- Real-time text and small file sharing
- Temporary rooms accessed via short sharing codes
- No database or persistent storage
- In-memory data transfer only for complete privacy
- Stateless backend architecture

## 🛠 Tech Stack
- Frontend: React
- Backend: Node.js, Express, Socket.IO
- Architecture: Stateless, in-memory communication
- Deployment: Vercel (frontend), Render (backend)

## 🌐 Live Demo
https://echo-share-beta.vercel.app/

## ⚙️ Local Setup
```bash
git clone https://github.com/whojaskaran/EchoShare.git
cd echoshare
cd backend && npm install && npm start
cd ../frontend && npm install && npm run dev
