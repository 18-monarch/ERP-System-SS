import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Check, AlertCircle } from "lucide-react";

const SessionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [regStatus, setRegStatus] = useState(null); // { status, position, error }

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/${id}`);
        setSession(res.data);
        if (res.data.user_reg_status) {
          setRegStatus({ 
            status: res.data.user_reg_status, 
            position: res.data.waitlist_position 
          });
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    setRegStatus(null);
    try {
      const res = await api.post(`/sessions/${id}/rsvp`);
      const status = res.data.status;
      setRegStatus({ status, position: res.data.waitlistPosition });
      
      // Update session counts locally
      setSession(prev => ({
        ...prev,
        confirmed_count: status === "confirmed" ? Number(prev.confirmed_count) + 1 : prev.confirmed_count,
        waitlisted_count: status === "waitlisted" ? Number(prev.waitlisted_count) + 1 : prev.waitlisted_count
      }));
    } catch (err) {
      setRegStatus({ error: err.response?.data?.error || "Failed to join session" });
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this session?")) return;
    setJoining(true);
    try {
      await api.delete(`/sessions/${id}/rsvp`);
      const prevStatus = regStatus?.status;
      setRegStatus(null);
      
      setSession(prev => ({
        ...prev,
        confirmed_count: prevStatus === "confirmed" ? Math.max(0, Number(prev.confirmed_count) - 1) : prev.confirmed_count,
        waitlisted_count: prevStatus === "waitlisted" ? Math.max(0, Number(prev.waitlisted_count) - 1) : prev.waitlisted_count
      }));
    } catch (err) {
      alert("Failed to leave session");
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <><Navbar /><div className="page-container"><p>Loading session details...</p></div></>;
  if (!session) return <><Navbar /><div className="page-container"><p>Session not found.</p></div></>;

  const sessionType = session.type || session.session_type || "daily";
  const isFull = sessionType === "sunday" && Number(session.confirmed_count) >= Number(session.max_players);
  const spotsLeft = Number(session.max_players) - Number(session.confirmed_count);
  const sessionDate = new Date(session.date || session.date_time);

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in" style={{ maxWidth: "800px" }}>
        <button className="btn btn-ghost mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        <div className="card" style={{ padding: "2.5rem" }}>
          <div className="flex-row" style={{ gap: "0.75rem", marginBottom: "1rem" }}>
            <span className={`badge badge-${sessionType}`}>
              {sessionType === "daily" ? "Daily Session" : "Sunday Court"}
            </span>
            {spotsLeft > 0 ? (
               <span className="badge badge-success">{spotsLeft} slots left</span>
            ) : (
               <span className="badge badge-danger">Full (Waitlist Open)</span>
            )}
          </div>

          <h1 className="page-title" style={{ marginBottom: "1.5rem" }}>{session.title}</h1>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
            <div className="session-card-meta" style={{ fontSize: "1rem" }}>
              <Calendar size={20} style={{ color: "var(--brand-primary)" }} />
              <div>
                <p style={{ fontWeight: "600", color: "var(--text-primary)" }}>Date</p>
                <p>{!isNaN(sessionDate) ? sessionDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Date TBD"}</p>
              </div>
            </div>
            <div className="session-card-meta" style={{ fontSize: "1rem" }}>
              <Clock size={20} style={{ color: "var(--brand-primary)" }} />
              <div>
                <p style={{ fontWeight: "600", color: "var(--text-primary)" }}>Time</p>
                <p>{!isNaN(sessionDate) ? sessionDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Time TBD"}</p>
              </div>
            </div>
            <div className="session-card-meta" style={{ fontSize: "1rem" }}>
              <MapPin size={20} style={{ color: "var(--brand-primary)" }} />
              <div>
                <p style={{ fontWeight: "600", color: "var(--text-primary)" }}>Location</p>
                <p>{session.location}</p>
              </div>
            </div>
            <div className="session-card-meta" style={{ fontSize: "1rem" }}>
              <Users size={20} style={{ color: "var(--brand-primary)" }} />
              <div>
                <p style={{ fontWeight: "600", color: "var(--text-primary)" }}>Players</p>
                <p>{session.confirmed_count} / {session.max_players} joined</p>
              </div>
            </div>
          </div>

          {session.waitlisted_count > 0 && (
            <div className="alert alert-warning mb-6" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
              <AlertCircle size={18} />
              <span>{session.waitlisted_count} players currently on the waitlist.</span>
            </div>
          )}

          <div className="flex-row" style={{ justifyContent: "center", marginTop: "1rem" }}>
            {regStatus && !regStatus.error ? (
              <div style={{ textAlign: "center", width: "100%" }}>
                <div className={`join-result ${regStatus.status === "confirmed" ? "join-confirmed" : "join-waitlisted"}`} 
                     style={{ padding: "1.25rem", borderRadius: "12px", marginBottom: "1rem", fontSize: "1.1rem" }}>
                  {regStatus.status === "confirmed" ? (
                    <><Check size={24} /> You are confirmed for this session!</>
                  ) : (
                    <><Clock size={24} /> You are #{regStatus.position || session.waitlist_position} on the waitlist</>
                  )}
                </div>
                <button className="btn btn-outline-danger btn-full" onClick={handleLeave} disabled={joining}>
                  {joining ? "Processing..." : "Leave Session"}
                </button>
              </div>
            ) : (
              <div style={{ width: "100%" }}>
                {regStatus?.error && (
                  <div className="alert alert-error mb-4">
                    <AlertCircle size={18} />
                    <span>{regStatus.error}</span>
                  </div>
                )}
                <button 
                  className={`btn ${isFull ? "btn-warning" : "btn-primary"} btn-full`} 
                  style={{ padding: "1.25rem", fontSize: "1.1rem" }}
                  onClick={handleJoin} 
                  disabled={joining}
                >
                  {joining ? "Registering..." : isFull ? "Join Waitlist" : "Register Now"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionDetails;
