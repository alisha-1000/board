# ⚙️ CollabBoard Backend

This is the backend server for the **CollabBoard** application, powered by Node.js, Express, and Socket.io.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment Variables**:
   Create a `.env` file in this directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   CLIENT_URL=http://localhost:3000
   ```

3. **Run the Server**:
   ```bash
   npm start
   ```

## 🛠️ Tech Stack
- **Node.js & Express**
- **MongoDB & Mongoose**
- **Socket.io** for real-time signaling
- **JWT** for authentication

For full project documentation, please refer to the [Root README](../README.md).
