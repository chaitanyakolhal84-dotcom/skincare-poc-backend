const Referral = require("../models/Referral");
const User = require("../models/User");
const Order = require("../models/Order");
const Reward = require("../models/Reward");

// ==========================================
// GET ALL REFERRALS
// ADMIN ONLY
// ==========================================
const getReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find()
            .populate({
                path: "referrer",
                model: "User",
                select: "name email referralCode points"
            })
            .populate({
                path: "referredUser",
                model: "User",
                select: "name email referralCode points"
            })
            .sort({ createdAt: -1 });

        res.status(200).json(referrals);

    } catch (error) {
        console.error("Get referrals error:", error);

        res.status(500).json({
            message: "Failed to get referrals",
            error: error.message
        });
    }
};


// ==========================================
// GET REFERRALS OF ONE USER
// ==========================================
const getUserReferrals = async (req, res) => {
    try {
        const { userId } = req.params;

        // Normal user can only see their own referrals
        if (
            req.user.role !== "admin" &&
            req.user._id.toString() !== userId
        ) {
            return res.status(403).json({
                message: "You are not authorized to view these referrals"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const referrals = await Referral.find({
            referrer: userId
        })
            .populate({
                path: "referredUser",
                model: "User",
                select: "name email referralCode points"
            })
            .sort({ createdAt: -1 });

        res.status(200).json(referrals);

    } catch (error) {
        console.error("Get user referrals error:", error);

        res.status(500).json({
            message: "Failed to get user referrals",
            error: error.message
        });
    }
};


// ==========================================
// PROCESS REFERRAL
// ADMIN ONLY
// ==========================================
const processReferral = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                message: "Order ID is required"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Referral can only be processed after
        // payment is Paid and order is Delivered
        if (
            order.paymentStatus !== "Paid" ||
            order.orderStatus !== "Delivered"
        ) {
            return res.status(400).json({
                message:
                    "Referral points can only be processed after a paid and delivered order"
            });
        }

        const referral = await Referral.findOne({
            referredUser: order.user,
            status: "Pending"
        });

        if (!referral) {
            return res.status(404).json({
                message: "No pending referral found for this user"
            });
        }

        const referrer = await User.findById(
            referral.referrer
        );

        if (!referrer) {
            return res.status(404).json({
                message: "Referrer user not found"
            });
        }

        const referralPoints = 100;

        // Add points to referrer
        referrer.points =
            (referrer.points || 0) + referralPoints;

        await referrer.save();

        // Complete referral
        referral.status = "Completed";
        referral.pointsAwarded = referralPoints;
        referral.completedAt = new Date();

        await referral.save();

        // Create reward history
        const existingReward = await Reward.findOne({
            user: referrer._id,
            type: "Referral",
            description:
                `Referral reward for user ${order.user}`
        });

        if (!existingReward) {
            await Reward.create({
                user: referrer._id,
                type: "Referral",
                points: referralPoints,
                description:
                    `Referral reward for user ${order.user}`
            });
        }

        res.status(200).json({
            message: "Referral processed successfully",

            pointsAwarded: referralPoints,

            referral: {
                id: referral._id,
                status: referral.status,
                pointsAwarded: referral.pointsAwarded,
                completedAt: referral.completedAt
            },

            referrer: {
                id: referrer._id,
                name: referrer.name,
                email: referrer.email,
                referralCode: referrer.referralCode,
                totalPoints: referrer.points
            },

            order: {
                id: order._id,
                user: order.user,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus
            }
        });

    } catch (error) {
        console.error("Process referral error:", error);

        res.status(500).json({
            message: "Failed to process referral",
            error: error.message
        });
    }
};


// ==========================================
// GET REFERRAL DASHBOARD
// ==========================================
const getReferralDashboard = async (req, res) => {
    try {
        const { userId } = req.params;

        // Normal user can only see their own dashboard
        if (
            req.user.role !== "admin" &&
            req.user._id.toString() !== userId
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to view this referral dashboard"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const referrals = await Referral.find({
            referrer: userId
        })
            .populate({
                path: "referredUser",
                model: "User",
                select:
                    "name email referralCode points createdAt"
            })
            .sort({ createdAt: -1 });

        const completedReferrals = referrals.filter(
            referral =>
                referral.status === "Completed"
        );

        const pendingReferrals = referrals.filter(
            referral =>
                referral.status === "Pending"
        );

        const totalReferralPoints =
            completedReferrals.reduce(
                (total, referral) =>
                    total +
                    (referral.pointsAwarded || 0),
                0
            );

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                referralCode: user.referralCode,
                points: user.points
            },

            summary: {
                totalReferrals: referrals.length,
                completedReferrals:
                    completedReferrals.length,
                pendingReferrals:
                    pendingReferrals.length,
                totalReferralPoints:
                    totalReferralPoints
            },

            completedReferrals,
            pendingReferrals,
            referrals
        });

    } catch (error) {
        console.error(
            "Referral dashboard error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to get referral dashboard",
            error: error.message
        });
    }
};


module.exports = {
    getReferrals,
    getUserReferrals,
    processReferral,
    getReferralDashboard
};