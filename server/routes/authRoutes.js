const router = require("express").Router();
const { register, login, me } = require("../controllers/authController");
const authenticateUser = require("../middleware/authMiddleware");
router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateUser, me);
module.exports = router;
