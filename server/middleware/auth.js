const jwt = require("jsonwebtoken");

function authenticator(req, res, next) {
    const authHeader = req.headers.authorization;

    // Ensure the token is available
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token from 'Bearer <token>'

    jwt.verify(token, process.env.JWT_SECRET || "your_secret_key", (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token" });
        }

        // Set the userId in the request object
        req.user = decoded.userId;
        next();
    });
}

module.exports = authenticator;
