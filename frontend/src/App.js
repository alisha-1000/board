import React from "react";
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
import InviteModal from "./components/InviteModal";
import { disconnectSocket } from "./utils/socket";

/* ---------------- PROTECTED ROUTE ---------------- */

/* ---------------- PROTECTED ROUTE ---------------- */

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    disconnectSocket();
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* ---------------- HOME PAGE ---------------- */

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

/* ---------------- APP ROOT ---------------- */

function App() {
  const googleClientId =
    process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    "727558649512-kq44kgr799hq6f7rho88gocu79tqgp9k.apps.googleusercontent.com";

  const token = localStorage.getItem("token");

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BoardProvider>
        <InviteModal />
        <Router>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route
              path="/login"
              element={token ? <Navigate to="/" replace /> : <Login />}
            />
            <Route path="/register" element={<Register />} />

            {/* PROTECTED ROUTES */}
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

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </BoardProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
