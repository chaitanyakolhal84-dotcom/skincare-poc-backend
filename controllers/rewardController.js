const User = require("../models/User");
const Reward = require("../models/Reward");
const Referral = require("../models/Referral");
const Order = require("../models/Order");

// ==========================================
// GET USER POINTS
// ==========================================
const getUserPoints = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select(
            "name email referralCode points"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                referralCode: user.referralCode,
                points: user.points
            }
        });

    } catch (error) {
        console.error("Get user points error:", error);

        res.status(500).json({
            message: "Failed to get user points",
            error: error.message
        });
    }
};


// ==========================================
// GET REWARD HISTORY
// ==========================================
const getRewardHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select(
            "name points"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const history = await Reward.find({
            user: userId
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                points: user.points
            },
            history
        });

    } catch (error) {
        console.error("Get reward history error:", error);

        res.status(500).json({
            message: "Failed to get reward history",
            error: error.message
        });
    }
};


// ==========================================
// REDEEM POINTS
// ==========================================
const redeemPoints = async (req, res) => {
    try {
        const {
            userId,
            points
        } = req.body;

        if (!userId || points === undefined) {
            return res.status(400).json({
                message: "userId and points are required"
            });
        }

        if (points <= 0) {
            return res.status(400).json({
                message: "Points must be greater than 0"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if ((user.points || 0) < points) {
            return res.status(400).json({
                message: "Insufficient points",
                currentPoints: user.points
            });
        }

        // Deduct points
        user.points -= points;

        await user.save();

        // Create redemption history
        const reward = await Reward.create({
            user: user._id,
            type: "Redemption",
            points: -points,
            description: `Redeemed ${points} points`
        });

        res.status(200).json({
            message: "Points redeemed successfully",

            user: {
                id: user._id,
                name: user.name,
                points: user.points
            },

            redemption: {
                pointsRedeemed: points,
                remainingPoints: user.points,
                reward
            }
        });

    } catch (error) {
        console.error("Redeem points error:", error);

        res.status(500).json({
            message: "Failed to redeem points",
            error: error.message
        });
    }
};


// ==========================================
// AWARD PURCHASE POINTS
// ==========================================
const awardPurchasePoints = async (req, res) => {
    try {
        const {
            userId,
            orderId
        } = req.body;

        if (!userId || !orderId) {
            return res.status(400).json({
                message:
                    "userId and orderId are required"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Make sure order belongs to this user
        if (
            order.user.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                message:
                    "This order does not belong to this user"
            });
        }

        // Purchase reward only after Paid + Delivered
        if (
            order.paymentStatus !== "Paid" ||
            order.orderStatus !== "Delivered"
        ) {
            return res.status(400).json({
                message:
                    "Purchase points can only be awarded after a paid and delivered order"
            });
        }

        // Prevent duplicate purchase rewards
        const existingReward = await Reward.findOne({
            user: userId,
            type: "Purchase",
            description:
                `Purchase reward for order ${orderId}`
        });

        if (existingReward) {
            return res.status(400).json({
                message:
                    "Purchase reward already exists for this order",
                reward: existingReward
            });
        }

        // ₹100 = 1 point
        const purchasePoints = Math.floor(
            order.totalAmount / 100
        );

        if (purchasePoints <= 0) {
            return res.status(400).json({
                message:
                    "Order amount is too low to earn points"
            });
        }

        user.points =
            (user.points || 0) + purchasePoints;

        await user.save();

        const reward = await Reward.create({
            user: user._id,
            type: "Purchase",
            points: purchasePoints,
            description:
                `Purchase reward for order ${orderId}`
        });

        res.status(200).json({
            message:
                "Purchase points awarded successfully",

            pointsAwarded: purchasePoints,

            user: {
                id: user._id,
                name: user.name,
                points: user.points
            },

            reward
        });

    } catch (error) {
        console.error(
            "Award purchase points error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to award purchase points",
            error: error.message
        });
    }
};


// ==========================================
// GET REWARDS DASHBOARD
// ==========================================
const getRewardsDashboard = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select(
            "name email referralCode points"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const history = await Reward.find({
            user: userId
        }).sort({
            createdAt: -1
        });

        const purchaseRewards = history.filter(
            reward => reward.type === "Purchase"
        );

        const referralRewards = history.filter(
            reward => reward.type === "Referral"
        );

        const redemptionRewards = history.filter(
            reward => reward.type === "Redemption"
        );

        const totalEarned = history
            .filter(
                reward =>
                    reward.type === "Purchase" ||
                    reward.type === "Referral"
            )
            .reduce(
                (total, reward) =>
                    total + reward.points,
                0
            );

        const totalRedeemed = redemptionRewards
            .reduce(
                (total, reward) =>
                    total + Math.abs(reward.points),
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
                currentPoints: user.points,
                totalEarned,
                totalRedeemed,
                purchaseRewardCount:
                    purchaseRewards.length,
                referralRewardCount:
                    referralRewards.length,
                redemptionCount:
                    redemptionRewards.length
            },

            purchaseRewards,
            referralRewards,
            redemptionRewards,
            history
        });

    } catch (error) {
        console.error(
            "Rewards dashboard error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to get rewards dashboard",
            error: error.message
        });
    }
};


// ==========================================
// ADD REFERRAL REWARD HISTORY
// ==========================================
const addReferralRewardHistory = async (req, res) => {
    try {
        const {
            userId,
            referralId
        } = req.body;

        if (!userId || !referralId) {
            return res.status(400).json({
                message:
                    "userId and referralId are required"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const referral =
            await Referral.findById(referralId);

        if (!referral) {
            return res.status(404).json({
                message: "Referral not found"
            });
        }

        // Verify referral belongs to user
        if (
            referral.referrer.toString() !==
            userId.toString()
        ) {
            return res.status(400).json({
                message:
                    "This referral does not belong to this user"
            });
        }

        if (referral.status !== "Completed") {
            return res.status(400).json({
                message:
                    "Referral is not completed"
            });
        }

        const points = referral.pointsAwarded;

        if (!points || points <= 0) {
            return res.status(400).json({
                message:
                    "Referral has no valid points awarded"
            });
        }

        const description =
            `Referral reward ${referralId}`;

        const existingReward =
            await Reward.findOne({
                user: userId,
                type: "Referral",
                description
            });

        if (existingReward) {
            return res.status(400).json({
                message:
                    "Referral reward history already exists",
                reward: existingReward
            });
        }

        const reward = await Reward.create({
            user: userId,
            type: "Referral",
            points,
            description
        });

        res.status(201).json({
            message:
                "Referral reward history added successfully",
            reward
        });

    } catch (error) {
        console.error(
            "Referral reward history error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to add referral reward history",
            error: error.message
        });
    }
};


// ==========================================
// EXPORT
// ==========================================
module.exports = {
    getUserPoints,
    getRewardHistory,
    redeemPoints,
    awardPurchasePoints,
    getRewardsDashboard,
    addReferralRewardHistory
};