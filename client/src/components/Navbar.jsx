import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Zap } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={user?.role === "admin" ? "/admin/dashboard" : "/player/dashboard"} className="navbar-brand">
          <Zap size={22} />
          <span>Shuttle Slicers <strong>OS</strong></span>
        </Link>

        <div className="navbar-right">
          {user && (
            <>
              <Link to="/sessions" className="navbar-link" style={{ marginRight: "1rem", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600" }}>Sessions</Link>
              <span className="navbar-user">
                <span className="navbar-name">{user.name}</span>
                <span className={`role-badge role-${user.role}`}>{user.role}</span>
              </span>
              <button className="btn-icon" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
