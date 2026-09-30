const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const referralRoutes = require("./routes/referralRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const couponRoutes = require("./routes/couponRoutes");

// ==========================================
// APP
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ==========================================
// HOME / HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Skincare POC Backend is working!",
        status: "success"
    });
});

// ==========================================
// API ROUTES
// ==========================================

// Authentication
app.use(
    "/api/auth",
    authRoutes
);

// Products
app.use(
    "/api/products",
    productRoutes
);

// Orders
app.use(
    "/api/orders",
    orderRoutes
);

// Referrals
app.use(
    "/api/referrals",
    referralRoutes
);

// Rewards
app.use(
    "/api/rewards",
    rewardRoutes
);

// Coupons
app.use(
    "/api/coupons",
    couponRoutes
);

// ==========================================
// 404 ROUTE
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
        path: req.originalUrl
    });
});

// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        const PORT =
            process.env.PORT || 5000;

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

        process.exit(1);
    });