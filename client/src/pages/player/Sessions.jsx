import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import { Calendar, MapPin, Users, Clock, AlertCircle, Check, ArrowRight } from "lucide-react";

const PlayerSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [results, setResults] = useState({}); // sessionId -> { status, error }
  const [filter, setFilter] = useState("all"); 

  useEffect(() => {
    api.get("/sessions/upcoming")
      .then((res) => {
        setSessions(res.data);
        const initialResults = {};
        res.data.forEach(s => {
          if (s.user_reg_status) {
            initialResults[s.id] = { status: s.user_reg_status, position: s.waitlist_position };
          }
        });
        setResults(initialResults);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (sessionId) => {
    setJoiningId(sessionId);
    try {
      const res = await api.post(`/sessions/${sessionId}/rsvp`);
      const status = res.data.status;
      setResults((prev) => ({ ...prev, [sessionId]: { status, position: res.data.waitlistPosition } }));
      
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                confirmed_count: status === "confirmed" ? Number(s.confirmed_count) + 1 : s.confirmed_count,
                waitlisted_count: status === "waitlisted" ? Number(s.waitlisted_count) + 1 : s.waitlisted_count,
                user_reg_status: status
              }
            : s
        )
      );
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to join";
      setResults((prev) => ({ ...prev, [sessionId]: { error: msg } }));
    } finally {
      setJoiningId(null);
    }
  };

  const upcomingSessions = sessions
    .filter((s) => new Date(s.date || s.date_time) >= new Date())
    .sort((a, b) => new Date(a.date || a.date_time) - new Date(b.date || b.date_time));

  const dailySessions = upcomingSessions.filter(s => (s.type || s.session_type) === "daily");
  const sundaySessions = upcomingSessions.filter(s => (s.type || s.session_type) === "sunday");

  const renderSessionCard = (s) => {
    const result = results[s.id];
    const sessionType = s.type || s.session_type || "daily";
    const isFull = sessionType === "sunday" && Number(s.confirmed_count) >= Number(s.max_players);
    const isJoining = joiningId === s.id;
    const spotsLeft = Number(s.max_players) - Number(s.confirmed_count);
    const standsRank = result?.position || s.waitlist_position;

    return (
      <div key={s.id} className="session-card session-card-player">
        <div className="session-card-body">
          <div className="session-card-left" onClick={() => navigate(`/sessions/${s.id}`)} style={{ cursor: "pointer" }}>
            <div className="flex-row" style={{ gap: "0.5rem", marginBottom: "0.5rem" }}>
              {spotsLeft > 0 ? (
                <span className="badge badge-success">{spotsLeft} slots left</span>
              ) : (
                <span className="badge badge-danger">Full (Waitlist Open)</span>
              )}
              <span className={`badge badge-${sessionType}`}>
                 {sessionType === "sunday" ? "Sunday Court" : "Daily"}
              </span>
            </div>

            <h3 className="session-card-title">{s.title || (sessionType === "sunday" ? "Sunday Court" : "Daily Session")}</h3>

            <div className="session-meta-grid">
              <span className="session-card-meta">
                <Calendar size={14} />
                {new Date(s.date || s.date_time).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </span>
              <span className="session-card-meta">
                <Clock size={14} />
                {new Date(s.date || s.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="session-card-meta">
                <MapPin size={14} /> {s.location}
              </span>
              <span className="session-card-meta">
                <Users size={14} /> {s.confirmed_count}/{s.max_players} confirmed
              </span>
            </div>

            {s.waitlisted_count > 0 && (
              <p className="session-waitlist">
                <AlertCircle size={12} /> {s.waitlisted_count} on waitlist
              </p>
            )}
          </div>

          <div className="session-card-action">
            {result && !result.error ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div className={`join-result ${result.status === "confirmed" ? "join-confirmed" : "join-waitlisted"}`} style={{ textAlign: "center", padding: "0.6rem", borderRadius: "10px", fontWeight: "600" }}>
                  {result.status === "confirmed" ? (
                    <><Check size={16} /> Confirmed</>
                  ) : (
                    <><Clock size={16} /> #{standsRank} Waitlist</>
                  )}
                </div>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => navigate(`/player/sessions/${s.id}`)}
                >
                  View Details
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {result?.error && (
                  <p style={{ color: "var(--accent-red)", fontSize: "0.75rem", textAlign: "center" }}>{result.error}</p>
                )}
                <button
                  className={`btn ${isFull ? "btn-primary" : "btn-primary"}`}
                  style={{ background: isFull ? "var(--accent-yellow)" : "var(--brand-primary)", border: "none" }}
                  onClick={() => handleJoin(s.id)}
                  disabled={isJoining}
                >
                  {isJoining ? "Registering..." : isFull ? "Join Waitlist" : "Register Now"}
                </button>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => navigate(`/player/sessions/${s.id}`)}
                >
                  View Details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Upcoming Sessions</h1>
            <p className="page-subtitle">Instantly register for upcoming badminton games</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {["all", "daily", "sunday"].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "daily" ? "Daily" : "Sunday"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-muted">Loading sessions...</p>
        ) : upcomingSessions.length === 0 ? (
          <div className="card empty-state">
            <Calendar size={48} />
            <p>No upcoming sessions available at the moment.</p>
          </div>
        ) : (
          <>
            {(filter === "all" || filter === "daily") && dailySessions.length > 0 && (
              <div className="mb-6">
                <div className="section-divider">Daily Sessions • Nirma Campus</div>
                <div className="session-list">
                  {dailySessions.map(renderSessionCard)}
                </div>
              </div>
            )}

            {(filter === "all" || filter === "sunday") && sundaySessions.length > 0 && (
              <div className="mb-6">
                <div className="section-divider">Sunday Court • Akshar Academy</div>
                <div className="session-list">
                  {sundaySessions.map(renderSessionCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PlayerSessions;

