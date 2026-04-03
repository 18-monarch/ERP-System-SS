import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/admin/Dashboard";
import CreateSession from "./pages/admin/CreateSession";
import Registrations from "./pages/admin/Registrations";

import PlayerDashboard from "./pages/player/Dashboard";
import PlayerSessions from "./pages/player/Sessions";
import SessionDetails from "./pages/player/SessionDetails";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin */}
          <Route
            path="/admin/dashboard"
            element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>}
          />
          <Route
            path="/admin/create-session"
            element={<ProtectedRoute role="admin"><CreateSession /></ProtectedRoute>}
          />
          <Route
            path="/admin/registrations"
            element={<ProtectedRoute role="admin"><Registrations /></ProtectedRoute>}
          />

          {/* Player & Shared */}
          <Route
            path="/player/dashboard"
            element={<ProtectedRoute role="player"><PlayerDashboard /></ProtectedRoute>}
          />
          <Route
            path="/sessions"
            element={<ProtectedRoute><PlayerSessions /></ProtectedRoute>}
          />
          <Route
            path="/sessions/:id"
            element={<ProtectedRoute><SessionDetails /></ProtectedRoute>}
          />

          {/* Catch-all → Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;