const pool = require("../config/db");

// POST /api/sessions/:id/attendance  (admin)
// Body: { records: [{ user_id, present }] }
const markAttendance = async (req, res) => {
  const sessionId = req.params.id;
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0)
    return res.status(400).json({ error: "records array required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const { user_id, present } of records) {
      await client.query(
        `INSERT INTO attendance (user_id, session_id, present)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, session_id) DO UPDATE SET present = EXCLUDED.present`,
        [user_id, sessionId, present]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Attendance marked successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Mark attendance error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

// GET /api/sessions/:id/attendance  (admin)
const getAttendance = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.present, u.id as user_id, u.name, u.email
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.session_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get attendance error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { markAttendance, getAttendance };
