const jwt = require("jsonwebtoken");

function authenticator(req, res, next) {
    const authHeader = req.headers.authorization;

    // Ensure the token is available
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token from 'Bearer <token>'

    // Get JWT secret from environment variable or use default (for development only)
    const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            return res.status(401).json({ message: "Token expired" });
        }

        // Set the userId in the request object
        req.user = decoded.userId;
        next();
    } catch (err) {
        console.error("Token verification error:", err.message);

        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" });
        }

        return res.status(401).json({ message: "Authentication failed" });
    }
}

module.exports = authenticator;
