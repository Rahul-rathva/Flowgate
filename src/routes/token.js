const express = require("express");
const { issueDemoToken } = require("../middleware/auth");

const router = express.Router();

/**
 * Demo-only endpoint to mint a JWT for testing per-user rate limits.
 * In a real deployment this would be replaced by your actual auth service.
 */
router.post("/token", (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }
  const token = issueDemoToken(username);
  res.json({ token });
});

module.exports = router;
