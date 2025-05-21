import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                message: "No authentication token, access denied",
                code: "NO_TOKEN",
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({ _id: decoded.userId });

            if (!user) {
                return res.status(401).json({
                    message: "User not found",
                    code: "USER_NOT_FOUND",
                });
            }

            req.user = user;
            next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: "Token has expired, please login again",
                    code: "TOKEN_EXPIRED",
                });
            }
            throw error;
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({
            message: "Authentication failed",
            code: "AUTH_FAILED",
        });
    }
};

export default auth;
