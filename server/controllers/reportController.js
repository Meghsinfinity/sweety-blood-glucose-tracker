const pool = require("../config/db");
const { getReportRanges } = require("../utils/reportDates");

async function runReport(req, res, range, title, includeReadings = false) {
  try {
    const summaryResult = await pool.query(
      `SELECT
         MAX(value)::int AS highest,
         MIN(value)::int AS lowest,
         ROUND(AVG(value), 1) AS average,
         COUNT(*)::int AS count
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
      [req.user.id, range.startDate, range.endDate]
    );
    const statistics = summaryResult.rows[0];
    let readings = [];
    if (includeReadings) {
      const detailResult = await pool.query(
        `SELECT id, reading_date, slot, value
         FROM readings WHERE user_id = $1 AND reading_date = $2
         ORDER BY CASE slot WHEN 'Morning' THEN 1 WHEN 'After breakfast' THEN 2
         WHEN 'After lunch' THEN 3 WHEN 'After dinner' THEN 4 END`,
        [req.user.id, range.startDate]
      );
      readings = detailResult.rows;
    }
    return res.json({
      report: title,
      dateRange: range,
      statistics,
      readings,
      empty: statistics.count === 0
    });
  } catch (error) {
    console.error("Report error:", error);
    return res.status(500).json({ message: "Unable to generate report." });
  }
}

function getRanges(req, res) {
  try {
    if (!req.query.date) throw new Error("Please provide a date query parameter in YYYY-MM-DD format.");
    return getReportRanges(req.query.date);
  } catch (error) {
    res.status(400).json({ message: error.message });
    return null;
  }
}

async function dailyReport(req, res) {
  const ranges = getRanges(req, res);
  if (!ranges) return;
  return runReport(req, res, ranges.daily, "Daily", true);
}
async function monthToDateReport(req, res) {
  const ranges = getRanges(req, res);
  if (!ranges) return;
  return runReport(req, res, ranges.monthToDate, "Month-to-date");
}
async function monthlyReport(req, res) {
  const ranges = getRanges(req, res);
  if (!ranges) return;
  return runReport(req, res, ranges.monthly, "Monthly");
}

module.exports = { dailyReport, monthToDateReport, monthlyReport };
