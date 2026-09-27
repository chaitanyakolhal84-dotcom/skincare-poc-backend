const User = require("../models/User");
const Referral = require("../models/Referral");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ==========================================
// GENERATE JWT TOKEN
// ==========================================
const generateToken = (userId) => {
    return jwt.sign(
        { userId: userId.toString() },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

// ==========================================
// REGISTER USER
// ==========================================
const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            referralCode
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // ==========================================
        // FIND REFERRER
        // ==========================================
        let referrer = null;

        if (referralCode) {
            referrer = await User.findOne({
                referralCode: referralCode.trim()
            });

            if (!referrer) {
                return res.status(400).json({
                    message: "Invalid referral code"
                });
            }
        }

        // ==========================================
        // GENERATE UNIQUE REFERRAL CODE
        // ==========================================
        let newReferralCode;
        let referralCodeExists = true;

        while (referralCodeExists) {
            newReferralCode =
                "SKIN" +
                Math.random()
                    .toString(36)
                    .substring(2, 10)
                    .toUpperCase();

            const existingCode = await User.findOne({
                referralCode: newReferralCode
            });

            referralCodeExists = !!existingCode;
        }

        // ==========================================
        // HASH PASSWORD
        // ==========================================
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // ==========================================
        // CREATE USER
        // ==========================================
        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            referralCode: newReferralCode,
            referredBy: referrer
                ? referrer._id
                : null
        });

        // ==========================================
        // CREATE REFERRAL
        // ==========================================
        if (referrer) {
            await Referral.create({
                referrer: referrer._id,
                referredUser: user._id,
                referralCode: user.referralCode,
                status: "Pending",
                pointsAwarded: 0
            });

            console.log(
                `Referral created: ${referrer.name} referred ${user.name}`
            );
        }

        const token = generateToken(user._id);

        res.status(201).json({
            message: "User registered successfully",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                referralCode: user.referralCode,
                referredBy: user.referredBy,
                points: user.points,
                role: user.role
            },

            referral: referrer
                ? {
                    status: "Pending",
                    referrer: {
                        id: referrer._id,
                        name: referrer.name,
                        referralCode: referrer.referralCode
                    }
                }
                : null
        });

    } catch (error) {
        console.error(
            "Register error:",
            error
        );

        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};

// ==========================================
// LOGIN USER
// ==========================================
const loginUser = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // ==========================================
        // FIND USER
        // ==========================================
        const user = await User.findOne({
            email: cleanEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // ==========================================
        // CHECK ACTIVE STATUS
        // ==========================================
        if (!user.isActive) {
            return res.status(403).json({
                message: "User account is inactive"
            });
        }

        // ==========================================
        // BCRYPT PASSWORD CHECK
        // ==========================================
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // ==========================================
        // GENERATE TOKEN
        // ==========================================
        const token = generateToken(user._id);

        console.log(
            `Login successful: ${user.email}`
        );

        res.status(200).json({
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                referralCode: user.referralCode,
                referredBy: user.referredBy,
                points: user.points,
                role: user.role
            }
        });

    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

// ==========================================
// EXPORT
// ==========================================
module.exports = {
    registerUser,
    loginUser
};