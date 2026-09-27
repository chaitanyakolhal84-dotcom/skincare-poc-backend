const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            enum: [
                "Referral",
                "Redemption",
                "Purchase"
            ],
            required: true
        },

        points: {
            type: Number,
            required: true
        },

        description: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model("Reward", rewardSchema);