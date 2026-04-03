const express = require("express");
const router = express.Router();
const {
  createSession,
  getAllSessions,
  getUpcomingSessions,
  getSessionById,
  deleteSession,
  exportRegistrations,
} = require("../controllers/sessionController");
const {
  joinSession,
  leaveSession,
  getSessionRegistrations,
  removeParticipant,
} = require("../controllers/rsvpController");
const {
  markAttendance,
  getAttendance,
} = require("../controllers/attendanceController");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/role");

// Session CRUD
router.post("/", verifyToken, requireAdmin, createSession);
router.get("/upcoming", verifyToken, getUpcomingSessions);
router.get("/:id", verifyToken, getSessionById);
router.get("/:id/export", verifyToken, requireAdmin, exportRegistrations);
router.delete("/:id", verifyToken, requireAdmin, deleteSession);

// RSVP
router.post("/:id/rsvp", verifyToken, joinSession);
router.delete("/:id/rsvp", verifyToken, leaveSession);
router.get("/:id/registrations", verifyToken, requireAdmin, getSessionRegistrations);
router.delete("/:id/admin/remove-participant", verifyToken, requireAdmin, removeParticipant);


// Attendance
router.post("/:id/attendance", verifyToken, requireAdmin, markAttendance);
router.get("/:id/attendance", verifyToken, requireAdmin, getAttendance);

module.exports = router;
