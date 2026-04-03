const express = require("express");
const router = express.Router();
const { getMyRegistrations } = require("../controllers/rsvpController");
const { verifyToken } = require("../middleware/auth");

// GET /api/rsvp/my — player's own registrations
router.get("/my", verifyToken, getMyRegistrations);

module.exports = router;
