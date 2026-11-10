const slots = ["Morning", "After breakfast", "After lunch", "After dinner"];

function getToday(timeZone = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isValidCalendarDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function validateReading(date, slot, value) {
  if (value === undefined || value === null || value === "") {
    return "Please enter a glucose value.";
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 40 || numericValue > 600) {
    return "Value must be between 40 and 600 mg/dl.";
  }

  if (!isValidCalendarDate(date)) return "Please enter a valid date.";
  if (date > getToday()) return "Date cannot be in the future.";
  if (!slots.includes(slot)) return "Please select a valid time slot.";

  return null;
}

module.exports = { slots, getToday, isValidCalendarDate, validateReading };
