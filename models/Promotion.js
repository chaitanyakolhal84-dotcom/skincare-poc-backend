const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        subtitle: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: "",
            trim: true
        },

        couponCode: {
            type: String,
            default: "",
            uppercase: true,
            trim: true
        },

        buttonText: {
            type: String,
            default: "Shop Now",
            trim: true
        },

        discountText: {
            type: String,
            default: "",
            trim: true
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
        },

        showOnHome: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Promotion", promotionSchema);