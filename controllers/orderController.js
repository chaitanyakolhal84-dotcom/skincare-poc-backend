const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Reward = require("../models/Reward");

// ==========================================
// CREATE ORDER
// ==========================================
const createOrder = async (req, res) => {
    try {
        const {
            user,
            items,
            shippingAddress,
            paymentMethod
        } = req.body;

        // Logged-in user ID from JWT
        const loggedInUserId = req.user._id.toString();

        // Normal user can create order only for themselves
        if (
            req.user.role !== "admin" &&
            user !== loggedInUserId
        ) {
            return res.status(403).json({
                message: "You can only create orders for yourself"
            });
        }

        if (!user || !items || items.length === 0 || !shippingAddress) {
            return res.status(400).json({
                message: "User, items and shipping address are required"
            });
        }

        const userExists = await User.findById(user);

        if (!userExists) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        let orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    message: `Product not found: ${item.product}`
                });
            }

            if (!product.isActive) {
                return res.status(400).json({
                    message: `${product.name} is not active`
                });
            }

            if (product.stockQuantity < item.quantity) {
                return res.status(400).json({
                    message: `Not enough stock for ${product.name}`
                });
            }

            const subtotal = product.price * item.quantity;

            orderItems.push({
                product: product._id,
                productName: product.name,
                price: product.price,
                quantity: item.quantity,
                subtotal
            });

            totalAmount += subtotal;

            product.stockQuantity -= item.quantity;

            await product.save();
        }

        const order = await Order.create({
            user,
            items: orderItems,
            totalAmount,
            shippingAddress,
            paymentMethod: paymentMethod || "COD"
        });

        res.status(201).json({
            message: "Order created successfully",
            order
        });

    } catch (error) {
        console.error("Create order error:", error);

        res.status(500).json({
            message: "Failed to create order",
            error: error.message
        });
    }
};


// ==========================================
// GET ALL ORDERS
// ==========================================
const getOrders = async (req, res) => {
    try {
        let query = {};

        // Normal user → only own orders
        if (req.user.role !== "admin") {
            query.user = req.user._id;
        }

        // Admin → all orders
        const orders = await Order.find(query)
            .populate("user", "name email")
            .populate("items.product", "name price")
            .sort({ createdAt: -1 });

        res.status(200).json(orders);

    } catch (error) {
        console.error("Get orders error:", error);

        res.status(500).json({
            message: "Failed to get orders",
            error: error.message
        });
    }
};


// ==========================================
// GET ORDER BY ID
// ==========================================
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name email")
            .populate("items.product", "name price");

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Normal user can only see own order
        if (
            req.user.role !== "admin" &&
            order.user._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You are not authorized to view this order"
            });
        }

        res.status(200).json(order);

    } catch (error) {
        console.error("Get order error:", error);

        res.status(500).json({
            message: "Failed to get order",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE ORDER STATUS
// ==========================================
const updateOrderStatus = async (req, res) => {
    try {
        const {
            orderStatus,
            paymentStatus
        } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        // Only admin can update order status
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admin can update order status"
            });
        }

        if (orderStatus) {
            order.orderStatus = orderStatus;
        }

        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
        }

        await order.save();


        // ==========================================
        // AUTOMATIC PURCHASE REWARD
        // ==========================================
        if (
            order.paymentStatus === "Paid" &&
            order.orderStatus === "Delivered"
        ) {
            const existingReward = await Reward.findOne({
                user: order.user,
                type: "Purchase",
                description: `Purchase reward for order ${order._id}`
            });

            if (!existingReward) {
                const purchasePoints = Math.floor(
                    order.totalAmount / 100
                );

                if (purchasePoints > 0) {
                    const user = await User.findById(order.user);

                    if (user) {
                        user.points =
                            (user.points || 0) + purchasePoints;

                        await user.save();

                        await Reward.create({
                            user: user._id,
                            type: "Purchase",
                            points: purchasePoints,
                            description:
                                `Purchase reward for order ${order._id}`
                        });

                        console.log(
                            `Purchase reward: ${purchasePoints} points awarded to ${user.name}`
                        );
                    }
                }
            }
        }

        res.status(200).json({
            message: "Order updated successfully",
            order
        });

    } catch (error) {
        console.error("Update order error:", error);

        res.status(500).json({
            message: "Failed to update order",
            error: error.message
        });
    }
};


module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
};