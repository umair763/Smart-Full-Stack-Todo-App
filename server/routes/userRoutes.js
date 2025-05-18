const express = require("express");
const { deleteAcc, googleSignIn, registerUser, loginUser, profile } = require("../controllers/userControllers");
const authenticator = require("../middleware/auth");

const router = express.Router();

router.post("/google-signin", googleSignIn); // Google Sign-In API
router.post("/register", registerUser); // Manual registration
router.post("/login", loginUser); // Login API
router.get("/profile", authenticator, profile); // Fetch user profile
router.delete("/delete-account", authenticator, deleteAcc);

module.exports = router;
