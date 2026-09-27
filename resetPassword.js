const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const newPassword = "Chaitanya@123";

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        const user = await User.findOneAndUpdate(
            {
                email: "chaitanya@test.com"
            },
            {
                password: hashedPassword
            },
            {
                new: true
            }
        );

        if (!user) {
            console.log("User not found");
        } else {
            console.log("Password reset successfully!");
            console.log("Email:", user.email);
            console.log("New Password:", newPassword);
        }

        await mongoose.disconnect();

    } catch (error) {
        console.error("Password reset error:", error);
    }
};

resetPassword();