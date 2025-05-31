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

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configure multer for profile image upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    },
});

// Upload middleware for profile images
export const profileImageUploadMiddleware = upload.single("picture");

// Register a new user
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

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
        res.status(500).json({ message: "Error registering user" });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

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
        res.status(500).json({ message: "Error logging in" });
    }
};

// Google Sign In
export const googleSignIn = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                message: "Google token is required",
                code: "MISSING_TOKEN",
            });
        }

        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: "726557724768-qplqm3h12oea644a7pqmnvf26umqssfr.apps.googleusercontent.com",
            });

            const { email, name, picture, sub: googleId } = ticket.getPayload();

            // Find or create user
            let user = await User.findOne({ email });
            if (!user) {
                user = new User({
                    username: name,
                    email,
                    googleId,
                    profileImage: picture,
                });
                await user.save();
            }

            // Generate token
            const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });

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
        } catch (error) {
            console.error("Google token verification error:", error);
            return res.status(401).json({
                message: "Invalid Google token",
                code: "INVALID_GOOGLE_TOKEN",
            });
        }
    } catch (error) {
        console.error("Google sign in error:", error);
        res.status(500).json({
            message: "Error signing in with Google",
            code: "GOOGLE_SIGNIN_ERROR",
        });
    }
};

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        // Return user with picture field for compatibility
        const userResponse = {
            ...user.toObject(),
            picture: user.profileImage, // Add picture field for backward compatibility
        };

        res.json(userResponse);
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Error fetching profile" });
    }
};

// Update username
export const updateUsername = async (req, res) => {
    try {
        const { username } = req.body;

        // Check if username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const user = await User.findByIdAndUpdate(req.user._id, { username }, { new: true }).select("-password");

        // Return user with picture field for compatibility
        const userResponse = {
            ...user.toObject(),
            picture: user.profileImage, // Add picture field for backward compatibility
        };

        res.json({
            message: "Username updated successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Update username error:", error);
        res.status(500).json({ message: "Error updating username" });
    }
};

// Update profile image
export const updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file uploaded" });
        }

        const { buffer, mimetype } = req.file;

        // Convert buffer to base64 data URL
        const base64Image = `data:${mimetype};base64,${buffer.toString("base64")}`;

        const user = await User.findByIdAndUpdate(req.user._id, { profileImage: base64Image }, { new: true }).select("-password");

        // Return user with picture field for compatibility
        const userResponse = {
            ...user.toObject(),
            picture: user.profileImage, // Add picture field for backward compatibility
        };

        res.json({
            message: "Profile image updated successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Update profile image error:", error);
        res.status(500).json({ message: "Error updating profile image" });
    }
};

// Delete account
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log(`Starting account deletion for user: ${userId}`);

        // Get all user's tasks first (needed for dependencies)
        const userTasks = await Task.find({ userId }).select("_id");
        const taskIds = userTasks.map((task) => task._id);

        // Delete all associated data in the correct order to handle dependencies
        const deletionPromises = [
            // Delete streaks
            Streak.deleteMany({ userId }),

            // Delete notifications
            Notification.deleteMany({ userId }),

            // Delete reminders
            Reminder.deleteMany({ userId }),

            // Delete attachments
            Attachment.deleteMany({ userId }),

            // Delete notes
            Note.deleteMany({ userId }),

            // Delete subtasks
            Subtask.deleteMany({ userId }),

            // Delete dependencies (both where user's tasks are dependent or prerequisite)
            Dependency.deleteMany({
                $or: [{ dependentTaskId: { $in: taskIds } }, { prerequisiteTaskId: { $in: taskIds } }],
            }),

            // Delete tasks
            Task.deleteMany({ userId }),
        ];

        // Execute all deletions
        const results = await Promise.all(deletionPromises);

        console.log("Deletion results:", {
            streaks: results[0].deletedCount,
            notifications: results[1].deletedCount,
            reminders: results[2].deletedCount,
            attachments: results[3].deletedCount,
            notes: results[4].deletedCount,
            subtasks: results[5].deletedCount,
            dependencies: results[6].deletedCount,
            tasks: results[7].deletedCount,
        });

        // Finally, delete the user account
        await User.findByIdAndDelete(userId);

        console.log(`Account deletion completed for user: ${userId}`);

        res.json({
            message: "Account and all associated data deleted successfully",
            deletedData: {
                streaks: results[0].deletedCount,
                notifications: results[1].deletedCount,
                reminders: results[2].deletedCount,
                attachments: results[3].deletedCount,
                notes: results[4].deletedCount,
                subtasks: results[5].deletedCount,
                dependencies: results[6].deletedCount,
                tasks: results[7].deletedCount,
            },
        });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({
            message: "Error deleting account",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

// Export user data
export const exportUserData = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch all user data
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
                // Don't include actual file data, just metadata
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

        // Set headers for file download
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="todo-data-${userId}-${new Date().toISOString().split("T")[0]}.json"`
        );

        res.json(exportData);
    } catch (error) {
        console.error("Export data error:", error);
        res.status(500).json({ message: "Error exporting data" });
    }
};
