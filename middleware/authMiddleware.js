const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No token provided. Please login first."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find user
        const user = await User.findById(decoded.userId).select(
            "-password"
        );

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "User account is inactive"
            });
        }

        // Attach user to request
        req.user = user;

        next();

    } catch (error) {
        console.error("Authentication error:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token has expired. Please login again."
            });
        }

        return res.status(401).json({
            message: "Invalid token. Please login again."
        });
    }
};

module.exports = {
    protect
};