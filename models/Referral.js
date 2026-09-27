const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
    {
        referrer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        referredUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        referralCode: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ["Pending", "Completed"],
            default: "Pending"
        },

        pointsAwarded: {
            type: Number,
            default: 0
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Referral", referralSchema);