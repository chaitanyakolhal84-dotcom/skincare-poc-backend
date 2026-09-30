const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        type: {
            type: String,
            enum: [
                "PERCENTAGE",
                "FIXED",
                "BUY_X_GET_Y"
            ],
            required: true
        },

        discountValue: {
            type: Number,
            default: 0
        },

        buyQuantity: {
            type: Number,
            default: 0
        },

        freeQuantity: {
            type: Number,
            default: 0
        },

        minimumOrderAmount: {
            type: Number,
            default: 0
        },

        usageLimit: {
            type: Number,
            default: 0
        },

        usedCount: {
            type: Number,
            default: 0
        },

        startDate: {
            type: Date,
            default: Date.now
        },

        endDate: {
            type: Date,
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Coupon",
    couponSchema
);