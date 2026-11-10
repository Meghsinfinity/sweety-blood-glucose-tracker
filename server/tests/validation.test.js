const test = require("node:test");
const assert = require("node:assert/strict");
const { validateReading, slots, isValidCalendarDate } = require("../utils/validation");
const { getReportRanges } = require("../utils/reportDates");

const pastDate = "2020-10-15";

test("accepts a valid reading", () => assert.equal(validateReading(pastDate, "Morning", 110), null));
test("requires a value", () => assert.equal(validateReading(pastDate, "Morning", ""), "Please enter a glucose value."));
test("rejects values below 40", () => assert.match(validateReading(pastDate, "Morning", 39), /between 40 and 600/));
test("rejects values above 600", () => assert.match(validateReading(pastDate, "Morning", 601), /between 40 and 600/));
test("rejects decimals", () => assert.match(validateReading(pastDate, "Morning", 100.5), /between 40 and 600/));
test("rejects invalid slot", () => assert.equal(validateReading(pastDate, "Evening", 100), "Please select a valid time slot."));
test("rejects impossible calendar dates", () => assert.equal(isValidCalendarDate("2026-02-30"), false));
test("has exactly four slots", () => assert.equal(slots.length, 4));
test("calculates daily and month-to-date ranges", () => {
  const ranges = getReportRanges("2026-10-15");
  assert.deepEqual(ranges.daily, { startDate: "2026-10-15", endDate: "2026-10-15" });
  assert.deepEqual(ranges.monthToDate, { startDate: "2026-10-01", endDate: "2026-10-15" });
});
test("calculates previous month including year rollover", () => {
  const ranges = getReportRanges("2026-01-10");
  assert.deepEqual(ranges.monthly, { startDate: "2025-12-01", endDate: "2025-12-31" });
});
