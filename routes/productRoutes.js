const express = require("express");

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// PUBLIC PRODUCT APIs
// ==========================================

// Get all products
router.get(
    "/",
    getProducts
);

// Get single product
router.get(
    "/:id",
    getProductById
);


// ==========================================
// ADMIN PRODUCT APIs
// ==========================================

// Create product
router.post(
    "/",
    protect,
    adminOnly,
    createProduct
);

// Update product
router.put(
    "/:id",
    protect,
    adminOnly,
    updateProduct
);

// Delete product
router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteProduct
);

module.exports = router;