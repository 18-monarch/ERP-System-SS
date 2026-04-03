import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import {
  PlusCircle,
  Users,
  CalendarCheck,
  ChevronRight,
  Activity,
  Award,
  TrendingUp,
  Layout,
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalPlayers: 0,
    todaySessions: 0,
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);

      const res = await api.get("/sessions");
      const data = Array.isArray(res.data) ? res.data : [];

      console.log("Sessions response:", data);

      setSessions(data);

      const today = new Date().toDateString();

      setStats({
        total: data.length,
        totalPlayers: data.reduce(
          (sum, s) => sum + Number(s.confirmed_count || 0),
          0
        ),
        todaySessions: data.filter((s) => {
          const sessionDate = new Date(s.date_time || s.date);
          return !isNaN(sessionDate) && sessionDate.toDateString() === today;
        }).length,
      });
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const upcomingSessions = sessions
    .filter((s) => {
      const sessionDate = new Date(s.date_time || s.date);
      return !isNaN(sessionDate) && sessionDate >= new Date();
    })
    .sort(
      (a, b) =>
        new Date(a.date_time || a.date) - new Date(b.date_time || b.date)
    )
    .slice(0, 5);

  return (
    <>
      <Navbar />

      <div className="page-container animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">
              Welcome back, <strong>{user?.name}</strong>. Manage your community
              here.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/admin/create-session")}
            style={{ padding: "0.8rem 1.5rem" }}
          >
            <PlusCircle size={18} />
            New Session
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "rgba(26,86,219,0.12)" }}
            >
              <Layout size={24} style={{ color: "var(--brand-primary)" }} />
            </div>
            <div>
              <p className="stat-value">{stats.total}</p>
              <p className="stat-label">Total Sessions</p>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "rgba(34,197,94,0.12)" }}
            >
              <Users size={24} style={{ color: "var(--accent-green)" }} />
            </div>
            <div>
              <p className="stat-value">{stats.totalPlayers}</p>
              <p className="stat-label">Total RSVPs</p>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "rgba(234,179,8,0.12)" }}
            >
              <TrendingUp size={24} style={{ color: "var(--accent-yellow)" }} />
            </div>
            <div>
              <p className="stat-value">{stats.todaySessions}</p>
              <p className="stat-label">Today's Games</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <div className="section-header">
              <h2 className="section-title">Recent & Upcoming</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate("/admin/registrations")}
              >
                View All <ChevronRight size={14} />
              </button>
            </div>

            {loading ? (
              <p className="text-muted">Loading...</p>
            ) : upcomingSessions.length === 0 ? (
              <div className="card empty-state">
                <CalendarCheck size={48} />
                <p>No upcoming sessions scheduled.</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate("/admin/create-session")}
                >
                  Create One Now
                </button>
              </div>
            ) : (
              <div className="session-list">
                {upcomingSessions.map((s) => {
                  const sessionDate = new Date(s.date_time || s.date);
                  const sessionType = s.session_type || s.type || "daily";
                  const sessionTitle =
                    s.title ||
                    (sessionType === "daily"
                      ? "Daily Session"
                      : "Sunday Court Session");

                  return (
                    <div
                      key={s.id}
                      className="session-card"
                      onClick={() =>
                        navigate(`/admin/registrations?session=${s.id}`)
                      }
                      style={{
                        borderLeft:
                          sessionType === "sunday"
                            ? "5px solid var(--brand-primary)"
                            : "5px solid var(--accent-blue)",
                        cursor: "pointer",
                      }}
                    >
                      <div className="session-card-left">
                        <div className="flex-row" style={{ gap: "0.5rem" }}>
                          <span className={`badge badge-${sessionType}`}>
                            {sessionType === "daily" ? "Daily" : "Sunday"}
                          </span>
                          <span className="badge badge-success">
                            {Number(s.confirmed_count || 0)} joined
                          </span>
                        </div>

                        <h3 className="session-card-title">{sessionTitle}</h3>

                        <p className="session-card-meta">
                          {sessionDate.toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                          {" · "}
                          {sessionDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {s.location}
                        </p>
                      </div>

                      <div className="session-card-action">
                        <ChevronRight size={20} className="text-muted" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="dashboard-side">
            <div className="card">
              <h3 className="card-title">
                <Activity size={18} /> Quick Actions
              </h3>

              <div className="action-list">
                <button
                  className="action-btn"
                  onClick={() => navigate("/admin/create-session")}
                >
                  <PlusCircle size={18} /> Create New Session
                </button>

                <button
                  className="action-btn"
                  onClick={() => navigate("/admin/registrations")}
                >
                  <Users size={18} /> Manage Registrations
                </button>

                <button
                  className="action-btn"
                  onClick={() => navigate("/admin/registrations")}
                >
                  <CalendarCheck size={18} /> Export Player Data
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">
                <Award size={18} /> Active Modules
              </h3>

              <div className="module-list">
                <div
                  className="module-item module-active"
                  style={{
                    background: "rgba(26,86,219,0.06)",
                    border: "1px solid rgba(26,86,219,0.15)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--brand-primary)",
                      }}
                    ></div>
                    <span>Badminton Community</span>
                  </div>
                </div>

                <div className="module-item">
                  <span className="text-muted">Tournaments</span>
                  <span className="coming-soon">Soon</span>
                </div>

                <div className="module-item">
                  <span className="text-muted">Leaderboards</span>
                  <span className="coming-soon">Soon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;