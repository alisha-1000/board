import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useParams, Navigate } from "react-router-dom";
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
  return token ? children : <Navigate to="/login" replace />;
};

/* -------- Home Page -------- */

function HomePage() {
  const { id } = useParams();

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
  useEffect(() => {
    const token = localStorage.getItem("whiteboard_user_token");
    if (token) connectSocket();

    return () => disconnectSocket();
  }, []);

  return (
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
  );
}

export default App;
