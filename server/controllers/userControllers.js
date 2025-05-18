const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/userModel");
const Task = require("../models/taskModel"); // Ensure Task is imported

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Google Sign-In Handler// Google Sign-In Handler
// Required for fetching images
const fetch = require("node-fetch");

// Google Sign-In Handler
exports.googleSignIn = async (req, res) => {
    const { name, email, picture } = req.body;

    if (!name || !email || !picture) {
        return res.status(400).json({ error: "Missing required fields (name, email, picture)" });
    }

    try {
        let user = await User.findOne({ email });

        if (!user) {
            // Fetch picture and convert to base64
            const response = await fetch(picture);
            const imageBuffer = await response.buffer();
            const base64Picture = imageBuffer.toString("base64");

            // Create new user
            user = new User({
                username: name,
                gender: "",
                occupation: "",
                organization: "",
                email: email,
                password: await bcrypt.hash("tempPassword123", 10),
                picture: base64Picture,
            });

            await user.save();
        }

        const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });

        return res.status(200).json({
            message: "User authenticated successfully",
            token: jwtToken,
            user: {
                username: user.username,
                email: user.email,
                picture: user.picture,
            },
        });
    } catch (error) {
        console.error("Error during Google sign-in:", error);
        return res.status(500).json({ error: "Failed to authenticate user" });
    }
};

// Set file size limit to 1
const MAX_SIZE = 1024 * 1024 * 1024 * 1024; // 1GB in bytes
const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed!"), false);
        }
        cb(null, true);
    },
});
// User registration
exports.registerUser = [
    upload.single("picture"), // Handle image uploads
    async (req, res) => {
        try {
            console.log("Request Body:", req.body);
            console.log("Password:", req.body.password);
            console.log("Picture:", req.file);

            const { username, gender, occupation, organization, email, password } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ message: "All fields are required" });
            }

            // Check file size (this is extra precaution if needed)
            if (req.file.size > 50 * 1024 * 1024) {
                return res.status(400).json({ message: "Picture size exceeds 50MB." });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            // Convert image to base64 string if it exists
            let base64Picture = null;
            if (req.file) {
                base64Picture = req.file.buffer.toString("base64"); // Convert buffer to base64
            }

            // Create a new user object with base64-encoded image
            const newUser = new User({
                username,
                gender,
                email,
                occupation,
                organization,
                password: hashedPassword,
                picture: base64Picture, // Store base64 image
            });

            // Save the user to the database
            await newUser.save();

            res.status(201).json({ message: "User registered successfully" });
        } catch (error) {
            console.error(error); // Log error to the console
            if (error instanceof multer.MulterError) {
                return res.status(400).json({ message: error.message });
            } else if (error.message) {
                // Generic error message
                return res.status(500).json({ message: error.message });
            }
            res.status(500).json({ message: "An internal server error occurred." });
        }
    },
];

// User login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });

        // Send the token to the client
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

//profile
exports.profile = async (req, res) => {
    try {
        const userId = req.user; // Get user ID from JWT
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID not found in request" });
        }

        const user = await User.findById(userId).select("-password"); // Fetch user and exclude password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prepare the picture as base64
        let base64Picture = null;
        if (user.picture) {
            const mimeType = "image/*";
            base64Picture = `data:${mimeType};base64,${user.picture}`; // Prepare base64 string
        }

        // Return user details including base64 image
        return res.status(200).json({
            username: user.username,
            email: user.email,
            gender: user.gender,
            occupation: user.occupation,
            organization: user.organization,
            picture: base64Picture, // Send the base64-encoded image
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user profile", error: error.message });
    }
};

// Delete Account Controller
exports.deleteAcc = async (req, res) => {
    try {
        const userId = req.user; // Extract user ID from the JWT

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID not found in request" });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete all tasks associated with the user
        await Task.deleteMany({ user: userId }); // Ensure it uses the `user` field

        // Delete the user
        await User.findByIdAndDelete(userId);

        return res.status(200).json({ message: "User and associated tasks deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({ message: "Failed to delete account", error: error.message });
    }
};
