import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useParams,
  Navigate,
} from "react-router-dom";

import { GoogleOAuthProvider } from "@react-oauth/google";

import Board from "./components/Board";
import Toolbar from "./components/Toolbar";
import Toolbox from "./components/Toolbox";
import Sidebar from "./components/Sidebar";
import BoardProvider from "./store/BoardProvider";
import ToolboxProvider from "./store/ToolboxProvider";
import Login from "./components/Login";
import Register from "./components/Register";
import { connectSocket, disconnectSocket } from "./utils/socket";

/* -------- Protected Route -------- */

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("whiteboard_user_token");

  if (!token) {
    disconnectSocket(); // 🔥 important
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* -------- Home Page -------- */

function HomePage() {
  const { id } = useParams();

  // 🔥 CONNECT SOCKET WHEN HOME LOADS (AUTHENTICATED)
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return (
    <ToolboxProvider>
      <div className="app-container">
        <Toolbar />
        <Board id={id} />
        <Toolbox />
        <Sidebar />
      </div>
    </ToolboxProvider>
  );
}

/* -------- App -------- */

function App() {
  return (
    <GoogleOAuthProvider clientId="727558649512-kq44kgr799hq6f7rho88gocu79tqgp9k.apps.googleusercontent.com">
      <BoardProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/:id"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </BoardProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
