import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
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
        console.error("Google sign in error:", error);
        res.status(500).json({ message: "Error signing in with Google" });
    }
};

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.json(user);
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

        res.json({
            message: "Username updated successfully",
            user,
        });
    } catch (error) {
        console.error("Update username error:", error);
        res.status(500).json({ message: "Error updating username" });
    }
};

// Update profile image
export const updateProfileImage = async (req, res) => {
    try {
        const { profileImage } = req.body;

        const user = await User.findByIdAndUpdate(req.user._id, { profileImage }, { new: true }).select("-password");

        res.json({
            message: "Profile image updated successfully",
            user,
        });
    } catch (error) {
        console.error("Update profile image error:", error);
        res.status(500).json({ message: "Error updating profile image" });
    }
};

// Delete account
export const deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ message: "Error deleting account" });
    }
};
