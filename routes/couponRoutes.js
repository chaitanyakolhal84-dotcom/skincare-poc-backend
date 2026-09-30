const express = require("express");

const {
    createCoupon,
    getCoupons,
    getActiveCoupons,
    applyCoupon,
    updateCoupon,
    deleteCoupon
} = require("../controllers/couponController");

const { protect } =
    require("../middleware/authMiddleware");

const { adminOnly } =
    require("../middleware/roleMiddleware");

const router = express.Router();

// Admin
router.post(
    "/",
    protect,
    adminOnly,
    createCoupon
);

router.get(
    "/",
    protect,
    adminOnly,
    getCoupons
);

router.put(
    "/:id",
    protect,
    adminOnly,
    updateCoupon
);

router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteCoupon
);

// User
router.get(
    "/active",
    protect,
    getActiveCoupons
);

router.post(
    "/apply",
    protect,
    applyCoupon
);

module.exports = router;