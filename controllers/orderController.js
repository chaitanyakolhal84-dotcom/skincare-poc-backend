const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Reward = require("../models/Reward");
const Referral = require("../models/Referral");
const Coupon = require("../models/Coupon");


// ==========================================
// CREATE ORDER
// ==========================================
const createOrder = async (req, res) => {
    try {
        const {
            user,
            items,
            shippingAddress,
            paymentMethod,
            couponCode
        } = req.body;

        // ==========================================
        // LOGGED-IN USER
        // ==========================================
        const loggedInUserId =
            req.user._id.toString();

        // Normal user can create only own order
        if (
            req.user.role !== "admin" &&
            user !== loggedInUserId
        ) {
            return res.status(403).json({
                message:
                    "You can only create orders for yourself"
            });
        }

        // ==========================================
        // BASIC VALIDATION
        // ==========================================
        if (
            !user ||
            !items ||
            !Array.isArray(items) ||
            items.length === 0 ||
            !shippingAddress
        ) {
            return res.status(400).json({
                message:
                    "User, items and shipping address are required"
            });
        }

        // ==========================================
        // CHECK USER
        // ==========================================
        const userExists =
            await User.findById(user);

        if (!userExists) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // ==========================================
        // BUILD ORDER ITEMS
        // ==========================================
        let orderItems = [];
        let subtotal = 0;

        for (const item of items) {

            if (!item.product) {
                return res.status(400).json({
                    message:
                        "Product ID is required"
                });
            }

            const quantity =
                Number(item.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity <= 0
            ) {
                return res.status(400).json({
                    message:
                        "Product quantity must be a positive integer"
                });
            }

            const product =
                await Product.findById(
                    item.product
                );

            if (!product) {
                return res.status(404).json({
                    message:
                        `Product not found: ${item.product}`
                });
            }

            if (!product.isActive) {
                return res.status(400).json({
                    message:
                        `${product.name} is not active`
                });
            }

            if (
                product.stockQuantity <
                quantity
            ) {
                return res.status(400).json({
                    message:
                        `Not enough stock for ${product.name}. Available stock: ${product.stockQuantity}`
                });
            }

            const itemSubtotal =
                product.price * quantity;

            orderItems.push({
                product: product._id,
                productName: product.name,
                price: product.price,
                quantity,
                subtotal: itemSubtotal
            });

            subtotal += itemSubtotal;
        }

        // ==========================================
        // COUPON CALCULATION
        // ==========================================
        let couponDiscount = 0;
        let finalAmount = subtotal;
        let appliedCoupon = null;

        if (couponCode) {

            const cleanCouponCode =
                couponCode
                    .trim()
                    .toUpperCase();

            const coupon =
                await Coupon.findOne({
                    code: cleanCouponCode
                });

            if (!coupon) {
                return res.status(400).json({
                    message:
                        "Invalid coupon code"
                });
            }

            const now = new Date();

            // ------------------------------------------
            // ACTIVE CHECK
            // ------------------------------------------
            if (!coupon.isActive) {
                return res.status(400).json({
                    message:
                        "This coupon is inactive"
                });
            }

            // ------------------------------------------
            // START DATE
            // ------------------------------------------
            if (
                coupon.startDate &&
                coupon.startDate > now
            ) {
                return res.status(400).json({
                    message:
                        "This coupon is not active yet"
                });
            }

            // ------------------------------------------
            // EXPIRY
            // ------------------------------------------
            if (
                coupon.endDate &&
                coupon.endDate < now
            ) {
                return res.status(400).json({
                    message:
                        "This coupon has expired"
                });
            }

            // ------------------------------------------
            // USAGE LIMIT
            // ------------------------------------------
            if (
                coupon.usageLimit > 0 &&
                coupon.usedCount >=
                coupon.usageLimit
            ) {
                return res.status(400).json({
                    message:
                        "Coupon usage limit reached"
                });
            }

            // ------------------------------------------
            // MINIMUM ORDER
            // ------------------------------------------
            if (
                subtotal <
                coupon.minimumOrderAmount
            ) {
                return res.status(400).json({
                    message:
                        `Minimum order amount is ₹${coupon.minimumOrderAmount}`
                });
            }

            // ==========================================
            // PERCENTAGE DISCOUNT
            // ==========================================
            if (
                coupon.type ===
                "PERCENTAGE"
            ) {

                couponDiscount =
                    subtotal *
                    (
                        coupon.discountValue /
                        100
                    );
            }

            // ==========================================
            // FIXED DISCOUNT
            // ==========================================
            else if (
                coupon.type === "FIXED"
            ) {

                couponDiscount =
                    Math.min(
                        coupon.discountValue,
                        subtotal
                    );
            }

            // ==========================================
            // BUY X GET Y
            // ==========================================
            else if (
                coupon.type ===
                "BUY_X_GET_Y"
            ) {

                let totalQuantity = 0;

                items.forEach((item) => {
                    totalQuantity +=
                        Number(item.quantity);
                });

                const requiredQuantity =
                    coupon.buyQuantity +
                    coupon.freeQuantity;

                if (
                    totalQuantity <
                    requiredQuantity
                ) {
                    return res.status(400).json({
                        message:
                            `Add at least ${requiredQuantity} items to use this coupon`
                    });
                }

                /*
                 * Example:
                 *
                 * B1G1
                 * buyQuantity = 1
                 * freeQuantity = 1
                 *
                 * 2 items = 1 free
                 *
                 * B2G2
                 * buyQuantity = 2
                 * freeQuantity = 2
                 *
                 * 4 items = 2 free
                 */

                const freeSets =
                    Math.floor(
                        totalQuantity /
                        requiredQuantity
                    );

                const freeItemCount =
                    freeSets *
                    coupon.freeQuantity;

                // Get every item price
                const prices = [];

                for (
                    const orderItem
                    of orderItems
                ) {

                    for (
                        let i = 0;
                        i < orderItem.quantity;
                        i++
                    ) {
                        prices.push(
                            orderItem.price
                        );
                    }
                }

                // Cheapest items become free
                prices.sort(
                    (a, b) => a - b
                );

                for (
                    let i = 0;
                    i < freeItemCount;
                    i++
                ) {
                    couponDiscount +=
                        prices[i];
                }
            }

            else {
                return res.status(400).json({
                    message:
                        "Unsupported coupon type"
                });
            }

            // ------------------------------------------
            // FINAL DISCOUNT SAFETY
            // ------------------------------------------
            couponDiscount =
                Number(
                    Math.min(
                        couponDiscount,
                        subtotal
                    ).toFixed(2)
                );

            finalAmount =
                Number(
                    (
                        subtotal -
                        couponDiscount
                    ).toFixed(2)
                );

            appliedCoupon = coupon;
        }

        // ==========================================
        // REDUCE STOCK
        // ==========================================
        for (const item of items) {

            const product =
                await Product.findById(
                    item.product
                );

            product.stockQuantity -=
                Number(item.quantity);

            await product.save();
        }

        // ==========================================
        // CREATE ORDER
        // ==========================================
        const order =
            await Order.create({
                user,
                items: orderItems,

                subtotal,

                couponCode:
                    appliedCoupon
                        ? appliedCoupon.code
                        : null,

                couponDiscount,

                finalAmount,

                // Keep totalAmount as final amount
                // so existing reward logic works
                totalAmount:
                    finalAmount,

                shippingAddress,

                paymentMethod:
                    paymentMethod || "COD"
            });

        // ==========================================
        // UPDATE COUPON USAGE
        // ==========================================
        if (appliedCoupon) {

            appliedCoupon.usedCount += 1;

            await appliedCoupon.save();
        }

        // ==========================================
        // RESPONSE
        // ==========================================
        res.status(201).json({
            message:
                "Order created successfully",

            order,

            coupon: appliedCoupon
                ? {
                    code:
                        appliedCoupon.code,

                    name:
                        appliedCoupon.name,

                    discount:
                        couponDiscount
                }
                : null
        });

    } catch (error) {

        console.error(
            "Create order error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to create order",

            error:
                error.message
        });
    }
};


// ==========================================
// GET ALL ORDERS
// ==========================================
const getOrders = async (req, res) => {
    try {

        let query = {};

        // Normal user → own orders only
        if (req.user.role !== "admin") {
            query.user = req.user._id;
        }

        const orders =
            await Order.find(query)
                .populate(
                    "user",
                    "name email"
                )
                .populate(
                    "items.product",
                    "name price"
                )
                .sort({
                    createdAt: -1
                });

        res.status(200).json(
            orders
        );

    } catch (error) {

        console.error(
            "Get orders error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to get orders",

            error:
                error.message
        });
    }
};


// ==========================================
// GET ORDER BY ID
// ==========================================
const getOrderById = async (req, res) => {
    try {

        const order =
            await Order.findById(
                req.params.id
            )
                .populate(
                    "user",
                    "name email"
                )
                .populate(
                    "items.product",
                    "name price"
                );

        if (!order) {
            return res.status(404).json({
                message:
                    "Order not found"
            });
        }

        // Normal user → own order only
        if (
            req.user.role !== "admin" &&
            order.user._id.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                message:
                    "You are not authorized to view this order"
            });
        }

        res.status(200).json(
            order
        );

    } catch (error) {

        console.error(
            "Get order error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to get order",

            error:
                error.message
        });
    }
};


// ==========================================
// UPDATE ORDER STATUS
// ==========================================
const updateOrderStatus = async (
    req,
    res
) => {
    try {

        const {
            orderStatus,
            paymentStatus
        } = req.body;

        const order =
            await Order.findById(
                req.params.id
            );

        if (!order) {
            return res.status(404).json({
                message:
                    "Order not found"
            });
        }

        // Only admin
        if (
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                message:
                    "Only admin can update order status"
            });
        }

        // ------------------------------------------
        // UPDATE STATUS
        // ------------------------------------------
        if (orderStatus) {
            order.orderStatus =
                orderStatus;
        }

        if (paymentStatus) {
            order.paymentStatus =
                paymentStatus;
        }

        await order.save();

        // ==========================================
        // AUTOMATIC REWARDS
        // ==========================================
        if (
            order.paymentStatus ===
            "Paid" &&
            order.orderStatus ===
            "Delivered"
        ) {

            // ==========================================
            // 1. PURCHASE REWARD
            // ==========================================

            const existingPurchaseReward =
                await Reward.findOne({
                    user: order.user,
                    type: "Purchase",
                    description:
                        `Purchase reward for order ${order._id}`
                });

            if (
                !existingPurchaseReward
            ) {

                const purchasePoints =
                    Math.floor(
                        order.totalAmount /
                        100
                    );

                if (
                    purchasePoints > 0
                ) {

                    const user =
                        await User.findById(
                            order.user
                        );

                    if (user) {

                        user.points =
                            (user.points || 0) +
                            purchasePoints;

                        await user.save();

                        await Reward.create({
                            user: user._id,
                            type: "Purchase",
                            points:
                                purchasePoints,
                            description:
                                `Purchase reward for order ${order._id}`
                        });

                        console.log(
                            `Purchase reward: ${purchasePoints} points awarded to ${user.name}`
                        );
                    }
                }
            }

            // ==========================================
            // 2. AUTOMATIC REFERRAL REWARD
            // ==========================================

            const pendingReferral =
                await Referral.findOne({
                    referredUser:
                        order.user,
                    status:
                        "Pending"
                });

            if (
                pendingReferral
            ) {

                const referrer =
                    await User.findById(
                        pendingReferral.referrer
                    );

                if (referrer) {

                    const referralPoints =
                        100;

                    // Add referral points
                    referrer.points =
                        (referrer.points || 0) +
                        referralPoints;

                    await referrer.save();

                    // Mark referral completed
                    pendingReferral.status =
                        "Completed";

                    pendingReferral.pointsAwarded =
                        referralPoints;

                    pendingReferral.completedAt =
                        new Date();

                    await pendingReferral.save();

                    // Referral reward history
                    const existingReferralReward =
                        await Reward.findOne({
                            user:
                                referrer._id,

                            type:
                                "Referral",

                            description:
                                `Referral reward for user ${order.user}`
                        });

                    if (
                        !existingReferralReward
                    ) {

                        await Reward.create({
                            user:
                                referrer._id,

                            type:
                                "Referral",

                            points:
                                referralPoints,

                            description:
                                `Referral reward for user ${order.user}`
                        });
                    }

                    console.log(
                        `Referral reward: ${referralPoints} points awarded to ${referrer.name}`
                    );
                }
            }
        }

        res.status(200).json({
            message:
                "Order updated successfully",

            order
        });

    } catch (error) {

        console.error(
            "Update order error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to update order",

            error:
                error.message
        });
    }
};


module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
};