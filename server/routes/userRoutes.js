const express = require("express");
const { getTasks, createTask, deleteTask, updateTask } = require("../controllers/taskControllers");
const authenticator = require("../middleware/auth");
const {
    deleteAcc,
    googleSignIn,
    registerUser,
    loginUser,
    profile,
    updateUsername,
    updateProfileImage,
} = require("../controllers/userControllers");

const router = express.Router();

router.get("/", authenticator, getTasks);
router.post("/", authenticator, createTask);
router.put("/:id", authenticator, updateTask);
router.delete("/:id", authenticator, deleteTask);
router.post("/google-signin", googleSignIn);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authenticator, profile);
router.post("/update-username", authenticator, updateUsername);
router.post("/update-profile-image", authenticator, updateProfileImage);
router.delete("/delete-account", authenticator, deleteAcc);

module.exports = router;
