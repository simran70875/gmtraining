// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1]; // Cleanly extract token after "Bearer"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // userId, email, or type can be embedded during login
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token." });
  }
};
