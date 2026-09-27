const express = require("express");

const {
    getReferrals,
    getUserReferrals,
    processReferral,
    getReferralDashboard
} = require("../controllers/referralController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// ADMIN - GET ALL REFERRALS
// ==========================================
router.get(
    "/",
    protect,
    adminOnly,
    getReferrals
);


// ==========================================
// USER - GET OWN REFERRALS
// ADMIN CAN VIEW ANY USER
// ==========================================
router.get(
    "/user/:userId",
    protect,
    getUserReferrals
);


// ==========================================
// USER - GET OWN REFERRAL DASHBOARD
// ADMIN CAN VIEW ANY USER
// ==========================================
router.get(
    "/dashboard/:userId",
    protect,
    getReferralDashboard
);


// ==========================================
// ADMIN - PROCESS REFERRAL
// ==========================================
router.post(
    "/process",
    protect,
    adminOnly,
    processReferral
);


module.exports = router;