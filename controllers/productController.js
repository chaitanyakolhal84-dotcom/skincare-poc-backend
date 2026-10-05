const Product = require("../models/Product");


// ===============================
// GET ALL PRODUCTS
// ===============================
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({
            isActive: true
        }).sort({
            createdAt: -1
        });

        res.status(200).json(products);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch products",
            error: error.message
        });
    }
};


// ===============================
// GET PRODUCT BY ID
// ===============================
const getProductById = async (req, res) => {
    try {
        const product =
            await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json(product);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch product",
            error: error.message
        });
    }
};


// ===============================
// CREATE PRODUCT
// ===============================
const createProduct = async (req, res) => {
    try {
        const product =
            await Product.create(req.body);

        res.status(201).json({
            message: "Product created successfully",
            product
        });

    } catch (error) {
        console.error(error);

        res.status(400).json({
            message: "Failed to create product",
            error: error.message
        });
    }
};


// ===============================
// UPDATE PRODUCT
// ===============================

const updateProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            brand,
            skinType,
            stockQuantity
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Update fields
        if (name !== undefined) {
            product.name = name;
        }

        if (description !== undefined) {
            product.description = description;
        }

        if (price !== undefined) {
            product.price = Number(price);
        }

        if (category !== undefined) {
            product.category = category;
        }

        if (brand !== undefined) {
            product.brand = brand;
        }

        if (skinType !== undefined) {
            product.skinType = Array.isArray(skinType)
                ? skinType
                : skinType
                    ? skinType.split(",").map(item => item.trim())
                    : [];
        }

        // IMPORTANT: Stock update
        if (stockQuantity !== undefined) {
            const newStock = Number(stockQuantity);

            if (Number.isNaN(newStock) || newStock < 0) {
                return res.status(400).json({
                    message: "Stock quantity must be a valid number greater than or equal to 0"
                });
            }

            product.stockQuantity = newStock;
        }

        await product.save();

        res.status(200).json({
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        console.error("Update product error:", error);

        res.status(400).json({
            message: "Failed to update product",
            error: error.message
        });
    }
};


// ===============================
// DELETE PRODUCT
// ===============================
const deleteProduct = async (req, res) => {
    try {
        const product =
            await Product.findByIdAndDelete(
                req.params.id
            );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete product",
            error: error.message
        });
    }
};


module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};