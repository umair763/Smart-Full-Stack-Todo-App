const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/userModel");
const Task = require("../models/taskModel"); // Ensure Task is imported
const https = require("https");
const http = require("http");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Required for fetching images - with fallback
let fetch;
try {
    // Try to use node-fetch if available
    fetch = require("node-fetch");
} catch (e) {
    console.log("node-fetch not available, using custom implementation");
    // Simple fallback implementation of fetch for profile pictures
    fetch = async (url) => {
        return new Promise((resolve, reject) => {
            const isHttps = url.startsWith("https");
            const client = isHttps ? https : http;

            const req = client.get(url, (res) => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error(`HTTP status code ${res.statusCode}`));
                }

                const data = [];
                res.on("data", (chunk) => data.push(chunk));
                res.on("end", () => {
                    resolve({
                        ok: true,
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        buffer: () => Promise.resolve(Buffer.concat(data)),
                    });
                });
            });

            req.on("error", reject);
            req.end();
        });
    };
}

// Google Sign-In Handler// Google Sign-In Handler
// Google Sign-In Handler
exports.googleSignIn = async (req, res) => {
    try {
        const { name, email, picture } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Missing required fields (name, email)" });
        }

        // Log the incoming request data for debugging
        console.log("Google Sign-In request:", { name, email, picture: picture ? "Picture provided" : "No picture" });

        let user = await User.findOne({ email });

        if (!user) {
            console.log("Creating new user for:", email);

            // Create new user without trying to fetch the picture
            user = new User({
                username: name,
                gender: "",
                occupation: "",
                organization: "",
                email: email,
                password: await bcrypt.hash("tempPassword123" + Date.now(), 10), // Add timestamp to make unique
                picture: null, // Skip picture for now
            });

            await user.save();

            // If a picture URL was provided, try to fetch it in the background
            if (picture) {
                try {
                    console.log("Attempting to fetch profile picture");
                    const response = await fetch(picture);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                    }

                    const imageBuffer = await response.buffer();
                    const base64Picture = imageBuffer.toString("base64");

                    // Update the user with the picture after saving
                    await User.findByIdAndUpdate(user._id, { picture: base64Picture });
                    console.log("Profile picture updated successfully");
                } catch (pictureError) {
                    console.error("Error fetching profile picture:", pictureError);
                    // Non-blocking - we continue even if picture fetch fails
                }
            }
        }

        const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });
        console.log("User authenticated successfully:", user.email);

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
        return res.status(500).json({ error: `Failed to authenticate user: ${error.message}` });
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
            console.log("Registration request received");

            // Check if body contains required fields
            if (!req.body) {
                return res.status(400).json({ message: "Request body is missing" });
            }

            const { username, gender, occupation, organization, email, password } = req.body;
            console.log("Registration data:", {
                username,
                email,
                hasPassword: !!password,
                hasFile: !!req.file,
            });

            if (!username || !email || !password) {
                return res.status(400).json({ message: "All fields are required" });
            }

            try {
                // Check if user already exists - with error handling
                const existingUser = await User.findOne({ email }).maxTimeMS(15000);
                if (existingUser) {
                    return res.status(400).json({ message: "User already exists" });
                }
            } catch (dbError) {
                console.error("Database error checking existing user:", dbError);
                return res.status(500).json({ message: "Database error. Please try again." });
            }

            // Hash the password
            const saltRounds = 10;
            let hashedPassword;
            try {
                hashedPassword = await bcrypt.hash(password, saltRounds);
            } catch (hashError) {
                console.error("Password hashing error:", hashError);
                return res.status(500).json({ message: "Error securing your password. Please try again." });
            }

            // Convert image to base64 string if it exists
            let base64Picture = null;
            if (req.file) {
                try {
                    // Check file size if a file was uploaded
                    if (req.file.size > 50 * 1024 * 1024) {
                        return res.status(400).json({ message: "Picture size exceeds 50MB." });
                    }
                    base64Picture = req.file.buffer.toString("base64"); // Convert buffer to base64
                } catch (fileError) {
                    console.error("File processing error:", fileError);
                    // Continue without picture if there's an error
                }
            }

            // Create a new user object with base64-encoded image
            const newUser = new User({
                username,
                gender: gender || "",
                email,
                occupation: occupation || "",
                organization: organization || "",
                password: hashedPassword,
                picture: base64Picture, // Store base64 image
            });

            // Save the user to the database with error handling
            try {
                await newUser.save();
                console.log("User registered successfully:", email);
                res.status(201).json({ message: "User registered successfully" });
            } catch (saveError) {
                console.error("Error saving user:", saveError);
                res.status(500).json({ message: "Error creating user account. Please try again." });
            }
        } catch (error) {
            console.error("Registration error:", error); // Log error to the console
            if (error instanceof multer.MulterError) {
                return res.status(400).json({ message: `File upload error: ${error.message}` });
            } else if (error.message) {
                // Generic error message
                return res.status(500).json({ message: `Server error: ${error.message}` });
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

        // Return user details with picture as is (already base64)
        return res.status(200).json({
            username: user.username,
            email: user.email,
            gender: user.gender || "",
            occupation: user.occupation || "",
            organization: user.organization || "",
            picture: user.picture ? user.picture : null,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
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
