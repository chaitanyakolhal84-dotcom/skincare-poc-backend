const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ==========================================
// IMPORT ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const referralRoutes = require("./routes/referralRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const couponRoutes = require("./routes/couponRoutes");
const promotionRoutes = require("./routes/promotionRoutes");

// ==========================================
// CREATE EXPRESS APP
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ==========================================
// HOME / TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "Skincare POC Backend is working!"
    });
});

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/referrals", referralRoutes);

app.use("/api/rewards", rewardRoutes);

app.use("/api/coupons", couponRoutes);

app.use("/api/promotions", promotionRoutes);

// ==========================================
// 404 ROUTE
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    });