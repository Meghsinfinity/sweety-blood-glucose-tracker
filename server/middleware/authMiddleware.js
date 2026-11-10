const jwt = require("jsonwebtoken");

function authenticateUser(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token is required." });
  }
  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = authenticateUser;
