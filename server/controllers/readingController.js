const pool = require("../config/db");
const { validateReading, isValidCalendarDate } = require("../utils/validation");

function duplicateMessage(slot) {
  return `You already have an ${slot} reading for this date.`;
}

async function addReading(req, res) {
  const { date, slot, value } = req.body || {};
  const validationError = validateReading(date, slot, value);
  if (validationError) return res.status(400).json({ message: validationError });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Lock the user row so simultaneous add/edit operations for this user serialize.
    await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
    const countResult = await client.query(
      "SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2",
      [req.user.id, date]
    );
    if (countResult.rows[0].count >= 4) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "You can add only 4 readings per day." });
    }
    const result = await client.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reading_date::text AS reading_date, slot, value, created_at`,
      [req.user.id, date, slot, Number(value)]
    );
    await client.query("COMMIT");
    return res.status(201).json({ message: "Reading added successfully.", reading: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return res.status(409).json({ message: duplicateMessage(slot) });
    console.error("Add reading error:", error);
    return res.status(500).json({ message: "Unable to add reading." });
  } finally {
    client.release();
  }
}

async function getReadings(req, res) {
  try {
    const params = [req.user.id];
    let dateFilter = "";
    if (req.query.date !== undefined) {
      if (!isValidCalendarDate(req.query.date)) {
        return res.status(400).json({ message: "Please provide a valid date in YYYY-MM-DD format." });
      }
      params.push(req.query.date);
      dateFilter = " AND reading_date = $2";
    }
    const result = await pool.query(
      `SELECT id, reading_date::text AS reading_date, slot, value, created_at
 FROM readings WHERE user_id = $1${dateFilter}
       ORDER BY reading_date DESC,
       CASE slot WHEN 'Morning' THEN 1 WHEN 'After breakfast' THEN 2
       WHEN 'After lunch' THEN 3 WHEN 'After dinner' THEN 4 END`,
      params
    );
    return res.json({ count: result.rows.length, readings: result.rows });
  } catch (error) {
    console.error("Get readings error:", error);
    return res.status(500).json({ message: "Unable to fetch readings." });
  }
}

async function updateReading(req, res) {
  const { date, slot, value } = req.body || {};
  const validationError = validateReading(date, slot, value);
  if (validationError) return res.status(400).json({ message: validationError });
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: "Invalid reading ID." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
    const existing = await client.query(
      "SELECT id, reading_date::text AS reading_date FROM readings WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [req.params.id, req.user.id]
    );
    if (!existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Reading not found." });
    }
   const currentDate = String(existing.rows[0].reading_date).slice(0, 10);

    if (currentDate !== date) {
      const count = await client.query(
        "SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2",
        [req.user.id, date]
      );
      if (count.rows[0].count >= 4) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "You can add only 4 readings per day." });
      }
    }

    const result = await client.query(
      `UPDATE readings SET reading_date = $1, slot = $2, value = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, reading_date, slot, value, created_at`,
      [date, slot, Number(value), req.params.id, req.user.id]
    );
    await client.query("COMMIT");
    return res.json({ message: "Reading updated successfully.", reading: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return res.status(409).json({ message: duplicateMessage(slot) });
    console.error("Update reading error:", error);
    return res.status(500).json({ message: "Unable to update reading." });
  } finally {
    client.release();
  }
}

async function deleteReading(req, res) {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: "Invalid reading ID." });
  try {
    const result = await pool.query(
      "DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Reading not found." });
    return res.json({ message: "Reading deleted successfully." });
  } catch (error) {
    console.error("Delete reading error:", error);
    return res.status(500).json({ message: "Unable to delete reading." });
  }
}

module.exports = { addReading, getReadings, updateReading, deleteReading };
