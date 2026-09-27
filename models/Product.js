const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        image: {
            type: String,
            default: ""
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        category: {
            type: String,
            required: true
        },

        brand: {
            type: String,
            required: true
        },

        ingredients: {
            type: [String],
            default: []
        },

        skinType: {
            type: [String],
            default: []
        },

        benefits: {
            type: [String],
            default: []
        },

        usageInstructions: {
            type: String,
            default: ""
        },

        stockQuantity: {
            type: Number,
            default: 0,
            min: 0
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

module.exports = mongoose.model("Product", productSchema);