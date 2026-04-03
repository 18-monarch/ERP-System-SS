import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import { Calendar, MapPin, Clock, ChevronRight } from "lucide-react";

const PlayerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myRsvps, setMyRsvps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/rsvp/my")
      .then((res) => setMyRsvps(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upcoming = myRsvps.filter((r) => new Date(r.date) >= new Date());
  const past = myRsvps.filter((r) => new Date(r.date) < new Date());

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Sessions</h1>
            <p className="page-subtitle">Hey <strong>{user?.name}</strong>, here are your upcoming games</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/sessions")}>
            Join New Session
          </button>
        </div>

        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : myRsvps.length === 0 ? (
          <div className="card empty-state">
            <Calendar size={48} />
            <p>You haven't joined any sessions yet.</p>
            <button className="btn btn-primary" onClick={() => navigate("/sessions")}>
              Find a Session
            </button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h2 className="section-title mb-4">Upcoming</h2>
                <div className="session-list">
                  {upcoming.map((r) => (
                    <RsvpCard key={r.id} rsvp={r} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section style={{ marginTop: "2rem" }}>
                <h2 className="section-title mb-4" style={{ opacity: 0.6 }}>Past Sessions</h2>
                <div className="session-list" style={{ opacity: 0.6 }}>
                  {past.map((r) => (
                    <RsvpCard key={r.id} rsvp={r} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
};

const RsvpCard = ({ rsvp }) => {
  const navigate = useNavigate();
  return (
    <div className="session-card" style={{ borderLeft: rsvp.type === "sunday" ? "5px solid var(--brand-primary)" : "5px solid var(--accent-blue)" }}>
      <div className="session-card-left">
        <div className="flex-row" style={{ gap: "0.5rem", marginBottom: "0.4rem" }}>
          <span className={`badge badge-${rsvp.type}`}>
            {rsvp.type === "daily" ? "Daily" : "Sunday Court"}
          </span>
          <span className={`badge ${rsvp.status === "confirmed" ? "badge-success" : "badge-warning"}`}>
            {rsvp.status}
          </span>
        </div>
        <h3 className="session-card-title">{rsvp.title}</h3>
        <div className="session-meta-grid">
          <span className="session-card-meta">
            <Calendar size={14} />
            {new Date(rsvp.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" })}
          </span>
          <span className="session-card-meta">
            <Clock size={14} />
            {new Date(rsvp.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="session-card-meta">
            <MapPin size={14} /> {rsvp.location}
          </span>
        </div>
      </div>
      <div className="session-card-action">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/sessions/${rsvp.session_id}`)}>
          View Details
        </button>
      </div>
    </div>
  );
};

export default PlayerDashboard;

