const express = require("express");

const {
    getUserPoints,
    getRewardHistory,
    redeemPoints,
    awardPurchasePoints,
    getRewardsDashboard,
    addReferralRewardHistory
} = require("../controllers/rewardController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const { ownerOrAdmin } = require("../middleware/accessMiddleware");

const router = express.Router();


// ==========================================
// GET USER POINTS
// USER = OWN DATA
// ADMIN = ANY USER
// ==========================================
router.get(
    "/user/:userId",
    protect,
    ownerOrAdmin,
    getUserPoints
);


// ==========================================
// GET REWARD HISTORY
// USER = OWN DATA
// ADMIN = ANY USER
// ==========================================
router.get(
    "/history/:userId",
    protect,
    ownerOrAdmin,
    getRewardHistory
);


// ==========================================
// GET REWARDS DASHBOARD
// USER = OWN DATA
// ADMIN = ANY USER
// ==========================================
router.get(
    "/dashboard/:userId",
    protect,
    ownerOrAdmin,
    getRewardsDashboard
);


// ==========================================
// REDEEM POINTS
// USER = OWN POINTS
// ADMIN = ANY USER
// ==========================================
router.post(
    "/redeem",
    protect,
    ownerOrAdmin,
    redeemPoints
);


// ==========================================
// PURCHASE REWARD
// ADMIN ONLY
// ==========================================
router.post(
    "/purchase",
    protect,
    adminOnly,
    awardPurchasePoints
);


// ==========================================
// REFERRAL REWARD HISTORY
// ADMIN ONLY
// ==========================================
router.post(
    "/referral-history",
    protect,
    adminOnly,
    addReferralRewardHistory
);


module.exports = router;