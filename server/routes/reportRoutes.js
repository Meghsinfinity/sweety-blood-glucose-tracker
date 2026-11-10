const router = require("express").Router();
const authenticateUser = require("../middleware/authMiddleware");
const { dailyReport, monthToDateReport, monthlyReport } = require("../controllers/reportController");
router.use(authenticateUser);
router.get("/daily", dailyReport);
router.get("/month-to-date", monthToDateReport);
router.get("/monthly", monthlyReport);
module.exports = router;
