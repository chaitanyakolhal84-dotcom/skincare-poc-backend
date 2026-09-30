const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        productName: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        _id: false
    }
);

const orderSchema = new mongoose.Schema(
    {
        // ==========================================
        // USER
        // ==========================================
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ==========================================
        // ORDER ITEMS
        // ==========================================
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: "Order must contain at least one item"
            }
        },

        // ==========================================
        // PRICE DETAILS
        // ==========================================

        // Original cart amount
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        // Coupon code used by customer
        couponCode: {
            type: String,
            default: null,
            uppercase: true,
            trim: true
        },

        // Discount provided by coupon
        couponDiscount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Final amount after coupon
        finalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        // Keep totalAmount for existing rewards/order system
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        // ==========================================
        // SHIPPING ADDRESS
        // ==========================================
        shippingAddress: {
            type: String,
            required: true,
            trim: true
        },

        // ==========================================
        // PAYMENT METHOD
        // ==========================================
        paymentMethod: {
            type: String,

            // IMPORTANT:
            // Frontend sends "Online"
            enum: [
                "COD",
                "Online"
            ],

            default: "COD"
        },

        // ==========================================
        // PAYMENT STATUS
        // ==========================================
        paymentStatus: {
            type: String,

            enum: [
                "Pending",
                "Paid",
                "Failed",
                "Refunded"
            ],

            default: "Pending"
        },

        // ==========================================
        // ORDER STATUS
        // ==========================================
        orderStatus: {
            type: String,

            enum: [
                "Pending",
                "Processing",
                "Confirmed",
                "Shipped",
                "Delivered",
                "Cancelled"
            ],

            default: "Pending"
        }
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Order",
    orderSchema
);