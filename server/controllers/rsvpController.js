const pool = require("../config/db");

// POST /api/sessions/:id/rsvp  (player)
const joinSession = async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check existing RSVP
    const existing = await client.query(
      "SELECT status FROM registrations WHERE user_id = $1 AND session_id = $2",
      [userId, sessionId]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Already registered",
        status: existing.rows[0].status,
      });
    }

    // Lock session row and check capacity
    const sessionRes = await client.query(
      `SELECT type, max_players,
        (SELECT COUNT(*) FROM registrations WHERE session_id = $1 AND status = 'confirmed') as confirmed_count
       FROM sessions WHERE id = $2 FOR UPDATE`,
      [sessionId, sessionId]
    );

    if (sessionRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Session not found" });
    }

    const { type, max_players, confirmed_count } = sessionRes.rows[0];

    // Sunday sessions enforce strict limit; daily sessions always confirm
    let status = "confirmed";
    if (type === "sunday" && confirmed_count >= max_players) {
      status = "waitlisted";
    }

    await client.query(
      "INSERT INTO registrations (user_id, session_id, status) VALUES ($1, $2, $3)",
      [userId, sessionId, status]
    );

    let waitlistPosition = null;
    if (status === "waitlisted") {
      const posRes = await client.query(
        `SELECT COUNT(*) + 1 as pos FROM registrations
         WHERE session_id = $1 AND status = 'waitlisted'
         AND created_at < (SELECT created_at FROM registrations WHERE user_id = $2 AND session_id = $1)`,
        [sessionId, userId]
      );
      waitlistPosition = posRes.rows[0].pos;
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "RSVP successful", status, waitlistPosition });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("RSVP join error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

// DELETE /api/sessions/:id/rsvp  (player)
const leaveSession = async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id, status FROM registrations WHERE user_id = $1 AND session_id = $2",
      [userId, sessionId]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Registration not found" });
    }

    const wasConfirmed = existing.rows[0].status === "confirmed";

    await client.query(
      "DELETE FROM registrations WHERE user_id = $1 AND session_id = $2",
      [userId, sessionId]
    );

    // Promote first waitlisted player if the leaving player was confirmed
    if (wasConfirmed) {
      const waitlisted = await client.query(
        `SELECT id FROM registrations
         WHERE session_id = $1 AND status = 'waitlisted'
         ORDER BY created_at ASC LIMIT 1`,
        [sessionId]
      );
      if (waitlisted.rows.length > 0) {
        await client.query(
          "UPDATE registrations SET status = 'confirmed' WHERE id = $1",
          [waitlisted.rows[0].id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Left session successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Leave session error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

// GET /api/sessions/:id/registrations  (admin)
const getSessionRegistrations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.status, r.created_at,
              u.id as user_id, u.name, u.email
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.session_id = $1
       ORDER BY CASE WHEN r.status = 'confirmed' THEN 1 ELSE 2 END, r.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get registrations error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/rsvp/my  (player — their own registrations)
const getMyRegistrations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.status, r.created_at,
              s.id as session_id, s.title, s.type, s.location, s.date, s.max_players
       FROM registrations r
       JOIN sessions s ON r.session_id = s.id
       WHERE r.user_id = $1
       ORDER BY s.date ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get my registrations error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/sessions/:id/admin/remove-participant  (admin)
const removeParticipant = async (req, res) => {
  const sessionId = req.params.id;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "userId is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id, status FROM registrations WHERE user_id = $1 AND session_id = $2",
      [userId, sessionId]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Registration not found" });
    }

    const wasConfirmed = existing.rows[0].status === "confirmed";

    await client.query(
      "DELETE FROM registrations WHERE user_id = $1 AND session_id = $2",
      [userId, sessionId]
    );

    // Promote first waitlisted player if the removed player was confirmed
    if (wasConfirmed) {
      const waitlisted = await client.query(
        `SELECT id FROM registrations
         WHERE session_id = $1 AND status = 'waitlisted'
         ORDER BY created_at ASC LIMIT 1`,
        [sessionId]
      );
      if (waitlisted.rows.length > 0) {
        await client.query(
          "UPDATE registrations SET status = 'confirmed' WHERE id = $1",
          [waitlisted.rows[0].id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Participant removed successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Remove participant error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

module.exports = { joinSession, leaveSession, getSessionRegistrations, getMyRegistrations, removeParticipant };

