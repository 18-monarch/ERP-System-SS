import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import { Users, Check, Clock, CheckSquare, Download, ChevronDown, ChevronUp, Search, UserMinus } from "lucide-react";

const Registrations = () => {
  const [searchParams] = useSearchParams();
  const highlightSessionId = searchParams.get("session");

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(highlightSessionId || null);
  const [registrations, setRegistrations] = useState({});
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/sessions")
      .then((res) => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSession = async (sessionId) => {
    const sid = String(sessionId);
    if (expanded === sid) { setExpanded(null); return; }
    setExpanded(sid);

    if (!registrations[sid]) {
      const [regRes, attRes] = await Promise.all([
        api.get(`/sessions/${sid}/registrations`).catch(() => ({ data: [] })),
        api.get(`/sessions/${sid}/attendance`).catch(() => ({ data: [] })),
      ]);

      setRegistrations((prev) => ({ ...prev, [sid]: regRes.data }));

      const attMap = {};
      regRes.data.forEach((r) => { attMap[r.user_id] = false; });
      attRes.data.forEach((a) => { attMap[a.user_id] = a.present; });
      setAttendance((prev) => ({ ...prev, [sid]: attMap }));
    }
  };

  const togglePresent = (sessionId, userId) => {
    const sid = String(sessionId);
    setAttendance((prev) => ({
      ...prev,
      [sid]: { ...prev[sid], [userId]: !prev[sid]?.[userId] },
    }));
  };

  const saveAttendance = async (sessionId) => {
    const sid = String(sessionId);
    const attMap = attendance[sid] || {};
    const records = (registrations[sid] || []).map((r) => ({
      user_id: r.user_id,
      present: attMap[r.user_id] ?? false,
    }));

    setSaving(true);
    try {
      await api.post(`/sessions/${sid}/attendance`, { records });
      alert("Attendance saved successfully!");
    } catch {
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (sessionId) => {
    try {
      const res = await api.get(`/sessions/${sessionId}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `session_${sessionId}_players.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export registrations.");
    }
  };

  const handleRemoveParticipant = async (sessionId, userId) => {
    if (!window.confirm("Are you sure you want to remove this participant?")) return;
    try {
      await api.delete(`/sessions/${sessionId}/admin/remove-participant`, { data: { userId } });
      // Refresh registrations
      const regRes = await api.get(`/sessions/${sessionId}/registrations`);
      setRegistrations(prev => ({ ...prev, [sessionId]: regRes.data }));
      alert("Participant removed.");
    } catch (err) {
      alert("Failed to remove participant.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Session Management</h1>
            <p className="page-subtitle">Track registrations, mark attendance, and export data</p>
          </div>
          <div className="auth-logo" style={{ width: "48px", height: "48px", marginBottom: 0 }}>
             <Users size={24} />
          </div>
        </div>

        <div className="mb-6 card" style={{ padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.02)" }}>
           <Search size={18} className="text-muted" />
           <input type="text" placeholder="Search sessions..." className="input" style={{ border: "none", background: "none", padding: "0.25rem" }} />
        </div>

        {loading ? (
          <p className="text-muted">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <div className="card empty-state">
            <Users size={48} />
            <p>No sessions found.</p>
          </div>
        ) : (
          <div className="registration-list">
            {sessions.map((s) => {
              const sid = String(s.id);
              const isOpen = expanded === sid;
              const regs = registrations[sid] || [];
              const attMap = attendance[sid] || {};

              return (
                <div key={s.id} className="registration-card" style={{ border: isOpen ? "1px solid var(--brand-primary)" : "1px solid var(--border)" }}>
                  <div className="registration-header" onClick={() => toggleSession(s.id)} style={{ padding: "1.5rem" }}>
                    <div className="registration-info">
                      <span className={`badge badge-${s.type || s.session_type}`}>
                        {(s.type || s.session_type) === "daily" ? "Daily" : "Sunday"}
                      </span>
                      <div>
                        <h3 className="session-card-title" style={{ fontSize: "1.1rem" }}>{s.title || ((s.type || s.session_type) === "sunday" ? "Sunday Court" : "Daily Session")}</h3>
                        <p className="session-card-meta">
                          {new Date(s.date || s.date_time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          {" · "}{s.location}
                        </p>
                      </div>
                    </div>
                    <div className="registration-counts" style={{ gap: "1rem" }}>
                      <span className="count-confirmed"><Check size={14} /> {s.confirmed_count} joined</span>
                      {s.waitlisted_count > 0 && (
                        <span className="count-waitlist"><Clock size={14} /> {s.waitlisted_count} waiting</span>
                      )}
                      <div className="btn-icon" style={{ background: isOpen ? "rgba(26,86,219,0.1)" : "none", color: isOpen ? "var(--brand-primary)" : "inherit" }}>
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="registration-body animate-fade-in" style={{ background: "rgba(0,0,0,0.1)" }}>
                      <div style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                        <h4 style={{ fontSize: "0.9rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                          Participant List ({regs.length})
                        </h4>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleExport(s.id); }}>
                            <Download size={14} /> Export CSV
                          </button>
                        </div>
                      </div>

                      {regs.length === 0 ? (
                        <p className="text-muted" style={{ padding: "2rem", textAlign: "center" }}>No players registered yet.</p>
                      ) : (
                        <>
                          <div style={{ overflowX: "auto" }}>
                            <table className="reg-table">
                              <thead>
                                <tr>
                                  <th>Player</th>
                                  <th>Status</th>
                                  <th style={{ textAlign: "center" }}>Present</th>
                                  <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {regs.map((r) => (
                                  <tr key={r.id}>
                                    <td>
                                      <div style={{ fontWeight: "600" }}>{r.name}</div>
                                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{r.email}</div>
                                    </td>
                                    <td>
                                      <span className={`badge ${r.status === "confirmed" ? "badge-success" : "badge-warning"}`} style={{ fontSize: "0.7rem" }}>
                                        {r.status}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <input
                                        type="checkbox"
                                        className="att-checkbox"
                                        checked={attMap[r.user_id] ?? false}
                                        onChange={() => togglePresent(s.id, r.user_id)}
                                      />
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      <button 
                                        className="btn-icon" 
                                        style={{ marginLeft: "auto", color: "var(--accent-red)" }}
                                        onClick={() => handleRemoveParticipant(s.id, r.user_id)}
                                        title="Remove Player"
                                      >
                                        <UserMinus size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div style={{ padding: "1.25rem 1.5rem", textAlign: "right", background: "rgba(0,0,0,0.05)", borderTop: "1px solid var(--border)" }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => saveAttendance(s.id)}
                              disabled={saving}
                              style={{ minWidth: "160px" }}
                            >
                              <CheckSquare size={18} />
                              {saving ? "Saving..." : "Save Attendance"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Registrations;

