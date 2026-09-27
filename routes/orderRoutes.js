const express = require("express");

const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE ORDER
router.post(
    "/",
    protect,
    createOrder
);

// GET ALL ORDERS
router.get(
    "/",
    protect,
    getOrders
);

// GET SINGLE ORDER
router.get(
    "/:id",
    protect,
    getOrderById
);

// UPDATE ORDER STATUS
router.put(
    "/:id/status",
    protect,
    updateOrderStatus
);

module.exports = router;