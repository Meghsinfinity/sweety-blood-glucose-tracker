const { isValidCalendarDate } = require("./validation");

function getReportRanges(selectedDate) {
  if (!isValidCalendarDate(selectedDate)) {
    throw new Error("Please provide a valid date in YYYY-MM-DD format.");
  }

  const [year, month] = selectedDate.split("-").map(Number);
  const monthStart = `${selectedDate.slice(0, 7)}-01`;

  const previousMonthStartDate = new Date(Date.UTC(year, month - 2, 1));
  const previousMonthEndDate = new Date(Date.UTC(year, month - 1, 0));
  const format = (date) => date.toISOString().slice(0, 10);

  return {
    daily: { startDate: selectedDate, endDate: selectedDate },
    monthToDate: { startDate: monthStart, endDate: selectedDate },
    monthly: {
      startDate: format(previousMonthStartDate),
      endDate: format(previousMonthEndDate)
    }
  };
}

module.exports = { getReportRanges };
