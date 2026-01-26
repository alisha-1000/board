#  CollabBoard - Real-time Collaborative Whiteboard

![CollabBoard Banner](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)
![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-010101?logo=socket.io)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://whiteboard-rosy-nu.vercel.app/)
[![Render](https://img.shields.io/badge/Render-Deployed-4353ff?logo=render)](https://board-2-2su7.onrender.com)

CollabBoard is a powerful, real-time collaborative whiteboard application that allows multiple users to draw, brainstorm, and communicate in a shared canvas environment. Built with modern web technologies, it offers a seamless and interactive experience for teams and individuals.

**Deployed Links:**
- **Frontend**: https://whiteboard-rosy-nu.vercel.app/
- **Backend (API)**: https://board-2-2su7.onrender.com/

---

## Key Features

- ** Real-time Collaboration**: See changes instantly as they happen. Multi-user cursor tracking and live drawing synchronization ensure everyone stays on the same page.
- ** Versatile Drawing Tools**:
  - **Freehand**: Smooth brush strokes for natural sketching.
  - **Shapes**: Precise tools for Lines, Rectangles, Circles, and Arrows.
  - **Text**: Add annotations and notes directly on the canvas.
- ** Live Chat**: Integrated real-time chat for quick communication while brainstorming.
- ** Secure Access**:
  - Email & Password authentication.
  - Google OAuth integration for quick sign-in.
  - Private boards and secure sharing mechanisms.
- ** Responsive Design**: Optimized for different screen sizes using Tailwind CSS.
- ** Rich Aesthetics**: Clean, modern UI with glassmorphism effects and intuitive navigation.

---

##  Tech Stack

### Frontend
- **Framework**: [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Drawing Engine**: [Rough.js](https://roughjs.com/) & [Perfect-Freehand](https://github.com/steveruizok/perfect-freehand)
- **Real-time**: [Socket.io-client](https://socket.io/docs/v4/client-api/)
- **Auth**: [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- **State Management**: React Context API

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via [Mongoose](https://mongoosejs.com/))
- **Real-time**: [Socket.io](https://socket.io/)
- **Authentication**: JWT (JSON Web Tokens) & Google Auth Library

---

##  Project Structure

```text
.
├── backend/            # Express server and Socket.io logic
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API endpoints
│   └── server.js       # Main entry point
├── frontend/           # React application
│   ├── public/         # Static assets
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── store/      # Global state (Context)
│       ├── utils/      # Helper functions (Socket, logic)
│       └── App.js      # Main application logic
└── README.md           # Project documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- NPM or Yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd white_backup
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   CLIENT_URL=http://localhost:3000
   ```
   Start the backend:
   ```bash
   npm start
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` folder:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:5000
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   ```
   Start the frontend:
   ```bash
   npm start
   ```

---

## How to Use

1. **Sign Up / Login**: Create an account or sign in using Google.
2. **Create a Board**: Start a new canvas from the sidebar.
3. **Share**: Copy the URL of your board and share it with others to collaborate.
4. **Draw**: Use the toolbar to select different tools (Pen, Shapes, Text).
5. **Chat**: Use the chat window to communicate with other collaborators in real-time.


