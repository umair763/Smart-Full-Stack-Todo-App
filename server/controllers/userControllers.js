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

// Google Sign-In Handler
exports.googleSignIn = async (req, res) => {
    console.log("Google Sign-In request received");
    try {
        const { name, email, picture } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Missing required fields (name, email)" });
        }

        console.log("Processing Google Sign-In for:", email);

        // Find or create user
        let user = await User.findOne({ email });

        if (!user) {
            console.log("Creating new user for email:", email);

            // Fetch and convert Google profile picture to base64
            let base64Picture = null;
            if (picture) {
                try {
                    console.log("Fetching Google profile image:", picture);

                    // Try better approach with more headers to avoid CORS issues
                    const imageResponse = await fetch(picture, {
                        method: "GET",
                        headers: {
                            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                            "Accept-Encoding": "gzip, deflate, br",
                            "User-Agent": "Mozilla/5.0 (compatible; ServerFetch/1.0)",
                            "Sec-Fetch-Mode": "no-cors",
                            "Sec-Fetch-Dest": "image",
                            "Cache-Control": "no-cache",
                            Pragma: "no-cache",
                        },
                    });

                    if (imageResponse.ok) {
                        const imageBuffer = await imageResponse.buffer();
                        const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
                        base64Picture = `data:${contentType};base64,${imageBuffer.toString("base64")}`;
                        console.log("Successfully converted image to base64");
                    } else {
                        console.error("Failed to fetch image with first approach, trying alternative method");

                        // Fallback to simpler method
                        const alternativeResponse = await new Promise((resolve, reject) => {
                            const isHttps = picture.startsWith("https");
                            const client = isHttps ? https : http;

                            client
                                .get(picture, (res) => {
                                    if (res.statusCode !== 200) {
                                        return reject(new Error(`Failed to fetch image: ${res.statusCode}`));
                                    }

                                    const chunks = [];
                                    res.on("data", (chunk) => chunks.push(chunk));
                                    res.on("end", () => {
                                        const buffer = Buffer.concat(chunks);
                                        const contentType = res.headers["content-type"] || "image/jpeg";
                                        resolve({
                                            buffer,
                                            contentType,
                                        });
                                    });
                                })
                                .on("error", reject);
                        });

                        base64Picture = `data:${alternativeResponse.contentType};base64,${alternativeResponse.buffer.toString(
                            "base64"
                        )}`;
                        console.log("Successfully converted image with alternative method");
                    }
                } catch (imgError) {
                    console.error("Error fetching Google profile image:", imgError);
                    // Create a default image with first letter of name
                    const firstLetter = name.charAt(0).toUpperCase();
                    console.log("Using default image with first letter:", firstLetter);
                    // Continue without the image if there's an error
                }
            }

            // Create a user with picture from Google
            user = new User({
                username: name,
                email: email,
                password: await bcrypt.hash(Math.random().toString(36).substring(2) + Date.now().toString(), 10),
                gender: "",
                occupation: "",
                organization: "",
                picture: base64Picture, // Store converted base64 image instead of URL
            });

            await user.save();
            console.log("User created successfully with ID:", user._id);
        }
        // If user exists but doesn't have a picture, and we got one from Google now
        else if (user && !user.picture && picture) {
            try {
                console.log("Updating existing user with Google profile picture");
                // Fetch and convert Google profile picture to base64
                const imageResponse = await fetch(picture, {
                    headers: {
                        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                        "User-Agent": "Mozilla/5.0 (compatible; ServerFetch/1.0)",
                    },
                });

                if (imageResponse.ok) {
                    const imageBuffer = await imageResponse.buffer();
                    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
                    const base64Picture = `data:${contentType};base64,${imageBuffer.toString("base64")}`;

                    // Update user with the picture
                    user.picture = base64Picture;
                    await user.save();
                    console.log("Updated existing user with Google profile picture");
                }
            } catch (updateImgError) {
                console.error("Error updating existing user with Google profile picture:", updateImgError);
                // Continue without updating the image if there's an error
            }
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });
        console.log("Token generated for user:", email);

        // Return success response
        return res.status(200).json({
            message: "Google sign-in successful",
            token,
        });
    } catch (error) {
        console.error("Error in Google Sign-In:", error);
        return res.status(500).json({ error: "Server error during Google authentication" });
    }
};

// Set file size limit to 1
const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
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
    upload.single("picture"), // Optional image upload
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
                // Check if user already exists
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
                    if (req.file.size > 5 * 1024 * 1024) {
                        return res.status(400).json({ message: "Picture size exceeds 5MB." });
                    }
                    base64Picture = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`; // Convert buffer to base64 with mime type
                } catch (fileError) {
                    console.error("File processing error:", fileError);
                    // Continue without picture if there's an error
                }
            }

            // Create a new user object
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

                // Generate JWT token for immediate login
                const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "1d" });

                // Return token with success message for immediate login
                return res.status(201).json({
                    message: "User registered successfully",
                    token,
                });
            } catch (saveError) {
                console.error("Error saving user:", saveError);
                return res.status(500).json({ message: "Error creating user account. Please try again." });
            }
        } catch (error) {
            console.error("Registration error:", error); // Log error to the console
            if (error instanceof multer.MulterError) {
                return res.status(400).json({ message: `File upload error: ${error.message}` });
            } else if (error.message) {
                // Generic error message
                return res.status(500).json({ message: `Server error: ${error.message}` });
            }
            return res.status(500).json({ message: "An internal server error occurred." });
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

// Update Username
exports.updateUsername = async (req, res) => {
    try {
        const userId = req.user; // Get user ID from JWT
        const { username } = req.body;

        if (!username || username.trim() === "") {
            return res.status(400).json({ message: "Username is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.username = username;
        await user.save();

        return res.status(200).json({ message: "Username updated successfully" });
    } catch (error) {
        console.error("Error updating username:", error);
        res.status(500).json({ message: "Error updating username", error: error.message });
    }
};

// Update Profile Image
exports.updateProfileImage = [
    upload.single("picture"),
    async (req, res) => {
        try {
            const userId = req.user; // Get user ID from JWT

            if (!req.file) {
                return res.status(400).json({ message: "No image file provided" });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Convert image to base64
            const base64Picture = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

            user.picture = base64Picture;
            await user.save();

            return res.status(200).json({ message: "Profile image updated successfully" });
        } catch (error) {
            console.error("Error updating profile image:", error);
            res.status(500).json({ message: "Error updating profile image", error: error.message });
        }
    },
];

// Delete Account Controller
exports.deleteAcc = async (req, res) => {
    try {
        const userId = req.user; // Extract user ID from the JWT

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID not found in request" });
        }

        console.log("Attempting to delete user account:", userId);

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("User found, deleting associated tasks...");

        // Delete all tasks associated with the user
        const deleteTasksResult = await Task.deleteMany({ user: userId });
        console.log("Tasks deleted:", deleteTasksResult);

        // Delete the user
        const deleteUserResult = await User.findByIdAndDelete(userId);
        console.log("User deleted:", deleteUserResult);

        return res.status(200).json({ message: "User and associated tasks deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({ message: "Failed to delete account", error: error.message });
    }
};
