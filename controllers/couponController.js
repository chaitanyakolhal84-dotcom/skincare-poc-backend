const Coupon = require("../models/Coupon");
const Product = require("../models/Product");

// ==========================================
// CREATE COUPON - ADMIN
// ==========================================
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            name,
            description,
            type,
            discountValue,
            buyQuantity,
            freeQuantity,
            minimumOrderAmount,
            usageLimit,
            startDate,
            endDate,
            isActive
        } = req.body;

        if (!code || !name || !type) {
            return res.status(400).json({
                message:
                    "Code, name and coupon type are required"
            });
        }

        const cleanCode = code.trim().toUpperCase();

        const existingCoupon = await Coupon.findOne({
            code: cleanCode
        });

        if (existingCoupon) {
            return res.status(400).json({
                message: "Coupon code already exists"
            });
        }

        if (
            type === "PERCENTAGE" &&
            (discountValue <= 0 || discountValue > 100)
        ) {
            return res.status(400).json({
                message:
                    "Percentage discount must be between 1 and 100"
            });
        }

        if (
            type === "FIXED" &&
            Number(discountValue) <= 0
        ) {
            return res.status(400).json({
                message:
                    "Fixed discount must be greater than 0"
            });
        }

        if (type === "BUY_X_GET_Y") {
            if (
                Number(buyQuantity) <= 0 ||
                Number(freeQuantity) <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Buy quantity and free quantity must be greater than 0"
                });
            }
        }

        const coupon = await Coupon.create({
            code: cleanCode,
            name,
            description: description || "",
            type,
            discountValue:
                Number(discountValue) || 0,
            buyQuantity:
                Number(buyQuantity) || 0,
            freeQuantity:
                Number(freeQuantity) || 0,
            minimumOrderAmount:
                Number(minimumOrderAmount) || 0,
            usageLimit:
                Number(usageLimit) || 0,
            startDate:
                startDate || new Date(),
            endDate:
                endDate || null,
            isActive:
                isActive !== undefined
                    ? isActive
                    : true
        });

        res.status(201).json({
            message: "Coupon created successfully",
            coupon
        });

    } catch (error) {
        console.error(
            "Create coupon error:",
            error
        );

        res.status(500).json({
            message: "Failed to create coupon",
            error: error.message
        });
    }
};


// ==========================================
// GET ALL COUPONS - ADMIN
// ==========================================
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .sort({ createdAt: -1 });

        res.status(200).json(coupons);

    } catch (error) {
        console.error(
            "Get coupons error:",
            error
        );

        res.status(500).json({
            message: "Failed to get coupons",
            error: error.message
        });
    }
};


// ==========================================
// GET ACTIVE COUPONS - USER
// ==========================================
const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();

        const coupons = await Coupon.find({
            isActive: true,
            startDate: { $lte: now },
            $or: [
                { endDate: null },
                { endDate: { $gte: now } }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json(coupons);

    } catch (error) {
        console.error(
            "Get active coupons error:",
            error
        );

        res.status(500).json({
            message: "Failed to get active coupons",
            error: error.message
        });
    }
};


// ==========================================
// APPLY / VALIDATE COUPON
// ==========================================
const applyCoupon = async (req, res) => {
    try {
        const {
            code,
            items
        } = req.body;

        if (!code) {
            return res.status(400).json({
                message: "Coupon code is required"
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Cart items are required"
            });
        }

        const cleanCode =
            code.trim().toUpperCase();

        const coupon = await Coupon.findOne({
            code: cleanCode
        });

        if (!coupon) {
            return res.status(404).json({
                message: "Invalid coupon code"
            });
        }

        const now = new Date();

        if (!coupon.isActive) {
            return res.status(400).json({
                message: "This coupon is inactive"
            });
        }

        if (coupon.startDate > now) {
            return res.status(400).json({
                message: "This coupon is not active yet"
            });
        }

        if (
            coupon.endDate &&
            coupon.endDate < now
        ) {
            return res.status(400).json({
                message: "This coupon has expired"
            });
        }

        if (
            coupon.usageLimit > 0 &&
            coupon.usedCount >= coupon.usageLimit
        ) {
            return res.status(400).json({
                message: "Coupon usage limit reached"
            });
        }

        // ------------------------------------------
        // Calculate cart from DATABASE prices
        // ------------------------------------------

        let subtotal = 0;

        const cartItems = [];

        for (const item of items) {
            const product =
                await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    message:
                        `Product not found: ${item.product}`
                });
            }

            const quantity =
                Number(item.quantity);

            if (quantity <= 0) {
                return res.status(400).json({
                    message:
                        "Invalid product quantity"
                });
            }

            const itemSubtotal =
                product.price * quantity;

            subtotal += itemSubtotal;

            cartItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity
            });
        }

        if (
            subtotal <
            coupon.minimumOrderAmount
        ) {
            return res.status(400).json({
                message:
                    `Minimum order amount is ₹${coupon.minimumOrderAmount}`
            });
        }

        let discount = 0;
        let description = "";

        // ==========================================
        // PERCENTAGE
        // ==========================================
        if (coupon.type === "PERCENTAGE") {

            discount =
                subtotal *
                (coupon.discountValue / 100);

            description =
                `${coupon.discountValue}% OFF`;
        }

        // ==========================================
        // FIXED
        // ==========================================
        else if (coupon.type === "FIXED") {

            discount =
                Math.min(
                    coupon.discountValue,
                    subtotal
                );

            description =
                `₹${coupon.discountValue} OFF`;
        }

        // ==========================================
        // BUY X GET Y
        // ==========================================
        else if (
            coupon.type === "BUY_X_GET_Y"
        ) {

            const buyQuantity =
                coupon.buyQuantity;

            const freeQuantity =
                coupon.freeQuantity;

            let totalQuantity = 0;

            items.forEach((item) => {
                totalQuantity +=
                    Number(item.quantity);
            });

            if (
                totalQuantity <
                buyQuantity + freeQuantity
            ) {
                return res.status(400).json({
                    message:
                        `Add at least ${buyQuantity + freeQuantity} items to use this coupon`
                });
            }

            /*
             * For B1G1:
             * 2 items → 1 free
             *
             * For B2G2:
             * 4 items → 2 free
             */

            const freeSets =
                Math.floor(
                    totalQuantity /
                    (buyQuantity + freeQuantity)
                );

            const freeItemCount =
                freeSets * freeQuantity;

            /*
             * Find the cheapest items first
             * so discount calculation is fair.
             */

            const allUnits = [];

            cartItems.forEach((item) => {
                for (
                    let i = 0;
                    i < item.quantity;
                    i++
                ) {
                    allUnits.push({
                        price: item.price
                    });
                }
            });

            allUnits.sort(
                (a, b) =>
                    a.price - b.price
            );

            for (
                let i = 0;
                i < freeItemCount;
                i++
            ) {
                discount +=
                    allUnits[i].price;
            }

            description =
                `Buy ${buyQuantity} Get ${freeQuantity} Free`;
        }

        discount =
            Math.min(
                Number(discount.toFixed(2)),
                subtotal
            );

        const finalAmount =
            Number(
                (subtotal - discount)
                    .toFixed(2)
            );

        res.status(200).json({
            message:
                "Coupon applied successfully",

            coupon: {
                id: coupon._id,
                code: coupon.code,
                name: coupon.name,
                type: coupon.type
            },

            description,

            subtotal,

            discount,

            finalAmount,

            savings: discount
        });

    } catch (error) {
        console.error(
            "Apply coupon error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to apply coupon",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE COUPON - ADMIN
// ==========================================
const updateCoupon = async (req, res) => {
    try {
        const coupon =
            await Coupon.findById(
                req.params.id
            );

        if (!coupon) {
            return res.status(404).json({
                message: "Coupon not found"
            });
        }

        const {
            name,
            description,
            type,
            discountValue,
            buyQuantity,
            freeQuantity,
            minimumOrderAmount,
            usageLimit,
            startDate,
            endDate,
            isActive
        } = req.body;

        if (name !== undefined)
            coupon.name = name;

        if (description !== undefined)
            coupon.description = description;

        if (type !== undefined)
            coupon.type = type;

        if (discountValue !== undefined)
            coupon.discountValue =
                Number(discountValue);

        if (buyQuantity !== undefined)
            coupon.buyQuantity =
                Number(buyQuantity);

        if (freeQuantity !== undefined)
            coupon.freeQuantity =
                Number(freeQuantity);

        if (minimumOrderAmount !== undefined)
            coupon.minimumOrderAmount =
                Number(minimumOrderAmount);

        if (usageLimit !== undefined)
            coupon.usageLimit =
                Number(usageLimit);

        if (startDate !== undefined)
            coupon.startDate = startDate;

        if (endDate !== undefined)
            coupon.endDate = endDate;

        if (isActive !== undefined)
            coupon.isActive = isActive;

        await coupon.save();

        res.status(200).json({
            message:
                "Coupon updated successfully",
            coupon
        });

    } catch (error) {
        console.error(
            "Update coupon error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to update coupon",
            error: error.message
        });
    }
};


// ==========================================
// DELETE COUPON - ADMIN
// ==========================================
const deleteCoupon = async (req, res) => {
    try {
        const coupon =
            await Coupon.findByIdAndDelete(
                req.params.id
            );

        if (!coupon) {
            return res.status(404).json({
                message: "Coupon not found"
            });
        }

        res.status(200).json({
            message:
                "Coupon deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete coupon error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to delete coupon",
            error: error.message
        });
    }
};


module.exports = {
    createCoupon,
    getCoupons,
    getActiveCoupons,
    applyCoupon,
    updateCoupon,
    deleteCoupon
};