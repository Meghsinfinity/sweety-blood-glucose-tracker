require("dotenv").config();
const app = require("./app");
const pool = require("./config/db");

const port = Number(process.env.PORT || 5000);
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be set to a random string of at least 32 characters in server/.env");
  }
  await pool.query("SELECT 1");
  console.log("PostgreSQL connected.");
  app.listen(port, () => console.log(`Sweety API listening on http://localhost:${port}`));
}
start().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
