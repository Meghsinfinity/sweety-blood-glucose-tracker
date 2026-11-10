
require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("../config/db");

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const demoName = "Sweety Demo User";
    const demoEmail = "demo@sweety.com";
    const demoPassword = "SweetyDemo@123";

    const hashedPassword = await bcrypt.hash(
      demoPassword,
      Number(process.env.BCRYPT_ROUNDS || 12)
    );

    const userResult = await client.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password
       RETURNING id`,
      [demoName, demoEmail, hashedPassword]
    );

    const userId = userResult.rows[0].id;

    const readings = [
      ["Morning", 110],
      ["After breakfast", 145],
      ["After lunch", 135],
      ["After dinner", 125]
    ];

    for (const [slot, value] of readings) {
      await client.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, CURRENT_DATE - 1, $2, $3)
         ON CONFLICT (user_id, reading_date, slot)
         DO UPDATE SET value = EXCLUDED.value`,
        [userId, slot, value]
      );
    }

    await client.query("COMMIT");

    console.log("Demo user and sample readings created successfully.");
    console.log("Demo email:", demoEmail);
    console.log("Demo password:", demoPassword);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDatabase();
