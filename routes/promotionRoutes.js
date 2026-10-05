const express = require("express");

const {
    createPromotion,
    getPromotions,
    getActivePromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion
} = require("../controllers/promotionController");

const { protect } =
    require("../middleware/authMiddleware");

const { adminOnly } =
    require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// ADMIN ROUTES
// ==========================================

// Create promotion
router.post(
    "/",
    protect,
    adminOnly,
    createPromotion
);

// Get all promotions
router.get(
    "/",
    protect,
    adminOnly,
    getPromotions
);

// Update promotion
router.put(
    "/:id",
    protect,
    adminOnly,
    updatePromotion
);

// Delete promotion
router.delete(
    "/:id",
    protect,
    adminOnly,
    deletePromotion
);

// Activate / Deactivate promotion
router.patch(
    "/:id/toggle",
    protect,
    adminOnly,
    togglePromotion
);


// ==========================================
// HOME PAGE ROUTE
// ==========================================

// Get currently active promotion
router.get(
    "/active",
    getActivePromotion
);


module.exports = router;