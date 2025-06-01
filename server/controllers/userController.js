// Updated userController.js with improved error handling
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Subtask from "../models/Subtask.js";
import Note from "../models/Note.js";
import Attachment from "../models/Attachment.js";
import Dependency from "../models/Dependency.js";
import Reminder from "../models/Reminder.js";
import Notification from "../models/Notification.js";
import Streak from "../models/Streak.js";
import { OAuth2Client } from "google-auth-library";
import multer from "multer";

const GOOGLE_CLIENT_ID = "726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com";

// Configure multer for profile image upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    },
});

export const profileImageUploadMiddleware = upload.single("picture");

// Utility function to handle database operations with retry
const withRetry = async (operation, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
        try {
            return await operation();
        } catch (error) {
            console.error(`Database operation failed (attempt ${i + 1}):`, error.message);
            
            if (i === retries) {
                throw error;
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
};

// Register a new user
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: "Username, email, and password are required" 
            });
        }

        // Check if user already exists with retry
        const existingUser = await withRetry(async () => {
            return await User.findOne({ $or: [{ email }, { username }] });
        });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user with retry
        const user = await withRetry(async () => {
            const newUser = new User({ username, email, password });
            return await newUser.save();
        });

        // Generate token
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET || 'fallback-secret', 
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            message: "Error registering user",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                message: "Email and password are required" 
            });
        }

        // Find user with retry
        const user = await withRetry(async () => {
            return await User.findOne({ email });
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET || 'fallback-secret', 
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            message: "Error logging in",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Google Sign In with improved error handling
export const googleSignIn = async (req, res) => {
    try {
        const { token, clientId } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Google token is required",
                code: "MISSING_TOKEN",
            });
        }

        console.log("Processing Google sign-in request...");
        console.log("Using Google Client ID:", clientId || GOOGLE_CLIENT_ID);

        try {
            // Create client with provided or default client ID
            const client = new OAuth2Client(clientId || GOOGLE_CLIENT_ID);

            // Verify the token with timeout
            const verificationPromise = client.verifyIdToken({
                idToken: token,
                audience: clientId || GOOGLE_CLIENT_ID,
            });

            // Add timeout to verification
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Token verification timeout')), 15000);
            });

            const ticket = await Promise.race([verificationPromise, timeoutPromise]);
            const payload = ticket.getPayload();
            
            console.log("Google token verified successfully");

            const { email, name, picture, sub: googleId } = payload;

            if (!email) {
                return res.status(400).json({
                    message: "Email not provided by Google",
                    code: "MISSING_EMAIL",
                });
            }

            // Find or create user with retry and timeout
            const user = await withRetry(async () => {
                let existingUser = await User.findOne({ email });
                
                if (!existingUser) {
                    console.log("Creating new user for Google sign-in");
                    existingUser = new User({
                        username: name || email.split('@')[0],
                        email,
                        googleId,
                        profileImage: picture,
                    });
                    await existingUser.save();
                    console.log("New user created successfully");
                }
                
                return existingUser;
            });

            // Generate JWT token
            const jwtToken = jwt.sign(
                { userId: user._id }, 
                process.env.JWT_SECRET || 'fallback-secret', 
                { expiresIn: "7d" }
            );

            res.json({
                message: "Google sign in successful",
                token: jwtToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage,
                },
            });

        } catch (verificationError) {
            console.error("Google token verification failed:", verificationError);

            // Handle specific error types
            if (verificationError.message?.includes("Token used too late")) {
                return res.status(401).json({
                    message: "Google token has expired",
                    code: "TOKEN_EXPIRED",
                });
            }

            if (verificationError.message?.includes("Invalid audience")) {
                return res.status(401).json({
                    message: "Invalid Google client ID",
                    code: "INVALID_CLIENT_ID",
                });
            }

            if (verificationError.message?.includes("timeout")) {
                return res.status(408).json({
                    message: "Request timeout - please try again",
                    code: "REQUEST_TIMEOUT",
                });
            }

            return res.status(401).json({
                message: "Invalid Google token",
                code: "INVALID_GOOGLE_TOKEN",
                details: process.env.NODE_ENV === 'development' ? verificationError.message : undefined
            });
        }

    } catch (error) {
        console.error("Google sign in error:", error);
        
        // Handle database connection errors specifically
        if (error.message?.includes("buffering timed out")) {
            return res.status(503).json({
                message: "Database connection issue - please try again",
                code: "DATABASE_TIMEOUT",
            });
        }

        res.status(500).json({
            message: "Error signing in with Google",
            code: "GOOGLE_SIGNIN_ERROR",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const user = await withRetry(async () => {
            return await User.findById(req.user._id).select("-password");
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userResponse = {
            ...user.toObject(),
            picture: user.profileImage,
        };

        res.json(userResponse);
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ 
            message: "Error fetching profile",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update username
export const updateUsername = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        // Check if username is already taken
        const existingUser = await withRetry(async () => {
            return await User.findOne({ username });
        });

        if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const user = await withRetry(async () => {
            return await User.findByIdAndUpdate(
                req.user._id, 
                { username }, 
                { new: true }
            ).select("-password");
        });

        const userResponse = {
            ...user.toObject(),
            picture: user.profileImage,
        };

        res.json({
            message: "Username updated successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Update username error:", error);
        res.status(500).json({ 
            message: "Error updating username",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update profile image
export const updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file uploaded" });
        }

        const { buffer, mimetype } = req.file;
        const base64Image = `data:${mimetype};base64,${buffer.toString("base64")}`;

        const user = await withRetry(async () => {
            return await User.findByIdAndUpdate(
                req.user._id, 
                { profileImage: base64Image }, 
                { new: true }
            ).select("-password");
        });

        const userResponse = {
            ...user.toObject(),
            picture: user.profileImage,
        };

        res.json({
            message: "Profile image updated successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Update profile image error:", error);
        res.status(500).json({ 
            message: "Error updating profile image",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete account with improved error handling
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log(`Starting account deletion for user: ${userId}`);

        // Get all user's tasks first
        const userTasks = await withRetry(async () => {
            return await Task.find({ userId }).select("_id");
        });
        
        const taskIds = userTasks.map((task) => task._id);

        // Delete all associated data with retry
        const deletionResults = await withRetry(async () => {
            const promises = [
                Streak.deleteMany({ userId }),
                Notification.deleteMany({ userId }),
                Reminder.deleteMany({ userId }),
                Attachment.deleteMany({ userId }),
                Note.deleteMany({ userId }),
                Subtask.deleteMany({ userId }),
                Dependency.deleteMany({
                    $or: [
                        { dependentTaskId: { $in: taskIds } }, 
                        { prerequisiteTaskId: { $in: taskIds } }
                    ],
                }),
                Task.deleteMany({ userId }),
            ];

            return await Promise.all(promises);
        });

        // Delete the user account
        await withRetry(async () => {
            return await User.findByIdAndDelete(userId);
        });

        console.log(`Account deletion completed for user: ${userId}`);

        res.json({
            message: "Account and all associated data deleted successfully",
            deletedData: {
                streaks: deletionResults[0].deletedCount,
                notifications: deletionResults[1].deletedCount,
                reminders: deletionResults[2].deletedCount,
                attachments: deletionResults[3].deletedCount,
                notes: deletionResults[4].deletedCount,
                subtasks: deletionResults[5].deletedCount,
                dependencies: deletionResults[6].deletedCount,
                tasks: deletionResults[7].deletedCount,
            },
        });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({
            message: "Error deleting account",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Export user data with improved error handling
export const exportUserData = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch all user data with retry
        const userData = await withRetry(async () => {
            const [user, tasks, subtasks, notes, attachments, dependencies, reminders, notifications] = await Promise.all([
                User.findById(userId).select("-password"),
                Task.find({ userId }).lean(),
                Subtask.find({ userId }).lean(),
                Note.find({ userId }).lean(),
                Attachment.find({ userId }).lean(),
                Dependency.find({
                    $or: [
                        { dependentTaskId: { $in: await Task.find({ userId }).distinct("_id") } },
                        { prerequisiteTaskId: { $in: await Task.find({ userId }).distinct("_id") } },
                    ],
                }).lean(),
                Reminder.find({ userId }).lean(),
                Notification.find({ userId }).lean(),
            ]);

            return {
                user,
                tasks,
                subtasks,
                notes,
                attachments,
                dependencies,
                reminders,
                notifications,
            };
        });

        const { user, tasks, subtasks, notes, attachments, dependencies, reminders, notifications } = userData;

        const exportData = {
            exportDate: new Date().toISOString(),
            user: {
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            tasks,
            subtasks,
            notes,
            attachments: attachments.map((att) => ({
                ...att,
                filename: att.filename,
                originalname: att.originalname,
                mimetype: att.mimetype,
                size: att.size,
                taskId: att.taskId,
                createdAt: att.createdAt,
            })),
            dependencies,
            reminders,
            notifications,
            statistics: {
                totalTasks: tasks.length,
                completedTasks: tasks.filter((t) => t.completed).length,
                totalSubtasks: subtasks.length,
                completedSubtasks: subtasks.filter((st) => st.status).length,
                totalNotes: notes.length,
                totalAttachments: attachments.length,
                totalDependencies: dependencies.length,
                totalReminders: reminders.length,
                totalNotifications: notifications.length,
            },
        };

        res.setHeader("Content-Type", "application/json");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="todo-data-${userId}-${new Date().toISOString().split("T")[0]}.json"`
        );

        res.json(exportData);
    } catch (error) {
        console.error("Export data error:", error);
        res.status(500).json({ 
            message: "Error exporting data",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};