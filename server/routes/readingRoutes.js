const router = require("express").Router();
const authenticateUser = require("../middleware/authMiddleware");
const { addReading, getReadings, updateReading, deleteReading } = require("../controllers/readingController");
router.use(authenticateUser);
router.post("/", addReading);
router.get("/", getReadings);
router.put("/:id", updateReading);
router.delete("/:id", deleteReading);
module.exports = router;
