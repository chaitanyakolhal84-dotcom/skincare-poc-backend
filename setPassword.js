const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const userId = "6aaa1f4f25ddf6c4c936fb8a";
const newPassword = "123456";

const changePassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected");

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        const user = await User.findById(userId);

        if (!user) {
            console.log("User not found");
            process.exit(1);
        }

        user.password = hashedPassword;

        await user.save();

        console.log("Password changed successfully");
        console.log("Email:", user.email);
        console.log("New password:", newPassword);

        process.exit(0);

    } catch (error) {
        console.error(
            "Password change error:",
            error.message
        );

        process.exit(1);
    }
};

changePassword();