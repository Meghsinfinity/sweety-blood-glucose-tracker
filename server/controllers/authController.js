const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || !name.trim() ||
        typeof email !== "string" || !email.trim() ||
        typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ message: "Name must be 100 characters or fewer." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must contain at least 8 characters." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
  return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const hashedPassword = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), normalizedEmail, hashedPassword]
    );
    return res.status(201).json({ message: "Registration successful.", user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email is already registered." });
    }
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error during registration." });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || !email.trim() ||
        typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const result = await pool.query(
      "SELECT id, name, email, password FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    if (!result.rows.length) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const user = result.rows[0];
    const matches = await bcrypt.compare(password, user.password);
    if (!matches) return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
    return res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login." });
  }
}

async function me(req, res) {
  const result = await pool.query(
    "SELECT id, name, email, created_at FROM users WHERE id = $1",
    [req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ message: "User not found." });
  return res.json({ user: result.rows[0] });
}

module.exports = { register, login, me };
