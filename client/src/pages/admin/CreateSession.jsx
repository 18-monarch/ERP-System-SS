import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import { Copy, Check, ArrowLeft, CalendarPlus, Info } from "lucide-react";

const CreateSession = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    type: "daily",
    date: "",
    max_players: "16",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/sessions", {
        ...form,
        max_players: parseInt(form.max_players, 10),
      });

      setCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create session.");
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = created
    ? `${window.location.origin}/sessions/${created.id}`
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const resetForm = () => {
    setCreated(null);
    setCopied(false);
    setForm({
      title: "",
      type: "daily",
      date: "",
      max_players: "16",
    });
  };

  const locationLabel =
    form.type === "daily" ? "Nirma Campus" : "Akshar Sports Academy";

  const createdDate = created
    ? new Date(created.date_time || created.date)
    : null;

  return (
    <>
      <Navbar />

      <div className="page-container animate-fade-in" style={{ maxWidth: "600px" }}>
        <button
          className="btn btn-ghost mb-6"
          onClick={() => navigate("/admin/dashboard")}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="page-header" style={{ marginBottom: "2.5rem" }}>
          <div>
            <h1 className="page-title">New Session</h1>
            <p className="page-subtitle">
              Schedule a badminton session for the community
            </p>
          </div>

          <div
            className="auth-logo"
            style={{ marginBottom: 0, width: "48px", height: "48px" }}
          >
            <CalendarPlus size={24} />
          </div>
        </div>

        {!created ? (
          <div className="card" style={{ padding: "2rem" }}>
            {error && (
              <div className="alert alert-error mb-6">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-stack">
              <div className="form-group">
                <label className="form-label">Session Type</label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    className={`filter-tab ${form.type === "daily" ? "active" : ""}`}
                    style={{ padding: "0.85rem", borderRadius: "var(--radius-md)" }}
                    onClick={() => setForm({ ...form, type: "daily" })}
                  >
                    Daily Session
                  </button>

                  <button
                    type="button"
                    className={`filter-tab ${form.type === "sunday" ? "active" : ""}`}
                    style={{ padding: "0.85rem", borderRadius: "var(--radius-md)" }}
                    onClick={() => setForm({ ...form, type: "sunday" })}
                  >
                    Sunday Court
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Session Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="input"
                  placeholder="e.g. Evening Slicers — Court 1"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ position: "relative" }}>
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="input"
                  value={locationLabel}
                  readOnly
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    color: "var(--text-secondary)",
                  }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    marginTop: "0.4rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Info size={12} /> Automatically assigned based on session type.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Date & Time</label>
                  <input
                    id="date"
                    name="date"
                    type="datetime-local"
                    className="input"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Players</label>
                  <input
                    id="max_players"
                    name="max_players"
                    type="number"
                    className="input"
                    min="2"
                    max="50"
                    value={form.max_players}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: "1rem", padding: "1rem" }}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Session"}
              </button>
            </form>
          </div>
        ) : (
          <div
            className="card text-center animate-fade-in"
            style={{ padding: "3rem 2rem" }}
          >
            <div className="success-icon" style={{ width: "80px", height: "80px" }}>
              <Check size={44} />
            </div>

            <h2 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>
              Session Published!
            </h2>

            <p
              className="text-muted"
              style={{
                marginBottom: "0.5rem",
                fontWeight: "600",
                color: "var(--text-primary)",
              }}
            >
              {created.title}
            </p>

            <p className="text-muted" style={{ marginBottom: "2rem" }}>
              {createdDate && !isNaN(createdDate)
                ? createdDate.toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Date unavailable"}{" "}
              · {created.location}
            </p>

            <div
              className="invite-box"
              style={{
                background: "rgba(26,86,219,0.05)",
                border: "1px solid rgba(26,86,219,0.15)",
              }}
            >
              <span
                className="invite-label"
                style={{ color: "var(--brand-primary)" }}
              >
                Share Link
              </span>

              <div className="invite-link-row">
                <input
                  readOnly
                  value={inviteLink}
                  className="input"
                  style={{
                    flex: 1,
                    background: "#000",
                    border: "1px solid var(--border)",
                  }}
                />

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={copyLink}
                  style={{ minWidth: "100px" }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <p
                className="text-muted"
                style={{ fontSize: "0.85rem", marginTop: "0.75rem" }}
              >
                This link will work only if your frontend has a route for
                <strong> /sessions/:id</strong>.
              </p>
            </div>

            <div
              className="flex gap-3"
              style={{ justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/admin/dashboard")}
              >
                Return Home
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => navigate("/sessions")}
              >
                View Upcoming Sessions
              </button>

              <button className="btn btn-primary" onClick={resetForm}>
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CreateSession;