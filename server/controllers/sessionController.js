const pool = require("../config/db");

// POST /api/sessions  (admin only)
const createSession = async (req, res) => {
  const { title, type, date, max_players } = req.body;

  if (!title || !type || !date || !max_players)
    return res.status(400).json({ error: "All fields are required" });

  if (!["daily", "sunday"].includes(type))
    return res.status(400).json({ error: "type must be 'daily' or 'sunday'" });

  const location =
    type === "daily" ? "Nirma Campus" : "Akshar Sports Academy";

  try {
    const result = await pool.query(
      "INSERT INTO sessions (title, type, location, date, max_players, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [title, type, location, date, max_players, req.user.id]
    );

    const insertedId = result.rows[0].id;

    const sessionRes = await pool.query(
      `SELECT s.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'confirmed') as confirmed_count,
        (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'waitlisted') as waitlisted_count
       FROM sessions s JOIN users u ON s.created_by = u.id
       WHERE s.id = $1`,
      [insertedId]
    );

    res.status(201).json(sessionRes.rows[0]);
  } catch (err) {
    console.error("Create session error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/sessions  (authenticated)
const getAllSessions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'confirmed') as confirmed_count,
        (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'waitlisted') as waitlisted_count,
        r.status as user_reg_status,
        (SELECT COUNT(*) + 1 
         FROM registrations r2 
         WHERE r2.session_id = s.id 
           AND r2.status = 'waitlisted' 
           AND r2.created_at < r.created_at
        ) as waitlist_position
       FROM sessions s
       JOIN users u ON s.created_by = u.id
       LEFT JOIN registrations r ON s.id = r.session_id AND r.user_id = $1
       ORDER BY s.date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get sessions error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/sessions/:id  (authenticated)
const getSessionById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'confirmed') as confirmed_count,
        (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'waitlisted') as waitlisted_count,
        r.status as user_reg_status,
        (SELECT COUNT(*) + 1 
         FROM registrations r2 
         WHERE r2.session_id = s.id 
           AND r2.status = 'waitlisted' 
           AND r2.created_at < r.created_at
        ) as waitlist_position
       FROM sessions s
       JOIN users u ON s.created_by = u.id
       LEFT JOIN registrations r ON s.id = r.session_id AND r.user_id = $1
       WHERE s.id = $2`,
      [req.user.id, req.params.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Session not found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/sessions/:id  (admin only)
const deleteSession = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM sessions WHERE id = $1",
      [req.params.id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Session not found" });

    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/sessions/upcoming  (authenticated)
const getUpcomingSessions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'confirmed') as confirmed_count,
        (SELECT COUNT(*) FROM registrations WHERE session_id = s.id AND status = 'waitlisted') as waitlisted_count,
        r.status as user_reg_status,
        (SELECT COUNT(*) + 1 
         FROM registrations r2 
         WHERE r2.session_id = s.id 
           AND r2.status = 'waitlisted' 
           AND r2.created_at < r.created_at
        ) as waitlist_position
       FROM sessions s
       JOIN users u ON s.created_by = u.id
       LEFT JOIN registrations r ON s.id = r.session_id AND r.user_id = $1
       WHERE s.date >= CURRENT_TIMESTAMP
       ORDER BY s.date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get upcoming sessions error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/sessions/:id/export  (admin only)
const exportRegistrations = async (req, res) => {
  const sessionId = req.params.id;
  try {
    const sessionRes = await pool.query("SELECT * FROM sessions WHERE id = $1", [sessionId]);
    if (sessionRes.rows.length === 0) return res.status(404).json({ error: "Session not found" });

    const session = sessionRes.rows[0];

    const regRes = await pool.query(
      `SELECT u.name, u.email, r.status, COALESCE(a.present, false) as present
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN attendance a ON r.user_id = a.user_id AND r.session_id = a.session_id
       WHERE r.session_id = $1
       ORDER BY r.created_at ASC`,
      [sessionId]
    );

    const rows = regRes.rows;
    let csv = "Name,Email,Session Type,Date & Time,Location,Registration Status,Attendance Status\n";

    const dateTime = new Date(session.date).toLocaleString("en-IN");

    rows.forEach(r => {
      csv += `"${r.name}","${r.email}","${session.type}","${dateTime}","${session.location}","${r.status}","${r.present ? 'Present' : 'Absent'}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="session_${sessionId}_registrations.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error("Export registrations error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { 
  createSession, 
  getAllSessions, 
  getUpcomingSessions,
  getSessionById, 
  deleteSession,
  exportRegistrations 
};
