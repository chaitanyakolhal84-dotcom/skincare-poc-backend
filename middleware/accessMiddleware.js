const ownerOrAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        // Admin can access any user's data
        if (req.user.role === "admin") {
            return next();
        }

        const requestedUserId =
            req.params.userId || req.body.userId;

        if (!requestedUserId) {
            return res.status(400).json({
                message: "User ID is required"
            });
        }

        // Normal user can access only their own data
        if (
            req.user._id.toString() !==
            requestedUserId.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to access this user's rewards"
            });
        }

        next();

    } catch (error) {
        console.error(
            "Owner access error:",
            error
        );

        res.status(500).json({
            message: "Authorization check failed"
        });
    }
};

module.exports = {
    ownerOrAdmin
};