const Promotion = require("../models/Promotion");

// ==========================================
// CREATE PROMOTION - ADMIN
// ==========================================
const createPromotion = async (req, res) => {
    try {
        const {
            title,
            subtitle,
            description,
            couponCode,
            buttonText,
            discountText,
            startDate,
            endDate,
            isActive,
            showOnHome
        } = req.body;

        if (!title || !subtitle) {
            return res.status(400).json({
                message: "Title and subtitle are required"
            });
        }

        const shouldShowOnHome =
            showOnHome !== undefined ? showOnHome : true;

        // If this promotion should appear on Home,
        // hide all other promotions from Home.
        if (shouldShowOnHome) {
            await Promotion.updateMany(
                {},
                {
                    $set: {
                        showOnHome: false
                    }
                }
            );
        }

        const promotion = await Promotion.create({
            title,
            subtitle,
            description,
            couponCode,
            buttonText,
            discountText,
            startDate: startDate || Date.now(),
            endDate: endDate || null,
            isActive:
                isActive !== undefined ? isActive : true,
            showOnHome: shouldShowOnHome
        });

        res.status(201).json({
            message: "Promotion created successfully",
            promotion
        });

    } catch (error) {
        console.error("Create promotion error:", error);

        res.status(500).json({
            message: "Failed to create promotion",
            error: error.message
        });
    }
};


// ==========================================
// GET ALL PROMOTIONS - ADMIN
// ==========================================
const getPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: promotions.length,
            promotions
        });

    } catch (error) {
        console.error("Get promotions error:", error);

        res.status(500).json({
            message: "Failed to get promotions",
            error: error.message
        });
    }
};


// ==========================================
// GET ACTIVE HOME PROMOTION
// ==========================================
const getActivePromotion = async (req, res) => {
    try {
        const now = new Date();

        const promotion = await Promotion.findOne({
            isActive: true,
            showOnHome: true,
            startDate: { $lte: now },
            $or: [
                { endDate: null },
                { endDate: { $gte: now } }
            ]
        }).sort({ createdAt: -1 });

        if (!promotion) {
            return res.status(404).json({
                message: "No active promotion found"
            });
        }

        res.status(200).json({
            promotion
        });

    } catch (error) {
        console.error("Get active promotion error:", error);

        res.status(500).json({
            message: "Failed to get active promotion",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE PROMOTION - ADMIN
// ==========================================
const updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;

        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({
                message: "Promotion not found"
            });
        }

        const {
            title,
            subtitle,
            description,
            couponCode,
            buttonText,
            discountText,
            startDate,
            endDate,
            isActive,
            showOnHome
        } = req.body;

        // ==========================================
        // IMPORTANT:
        // If this promotion is being shown on Home,
        // hide all other promotions from Home.
        // ==========================================
        if (showOnHome === true) {
            await Promotion.updateMany(
                {
                    _id: { $ne: id }
                },
                {
                    $set: {
                        showOnHome: false
                    }
                }
            );
        }

        if (title !== undefined)
            promotion.title = title;

        if (subtitle !== undefined)
            promotion.subtitle = subtitle;

        if (description !== undefined)
            promotion.description = description;

        if (couponCode !== undefined)
            promotion.couponCode = couponCode;

        if (buttonText !== undefined)
            promotion.buttonText = buttonText;

        if (discountText !== undefined)
            promotion.discountText = discountText;

        if (startDate !== undefined)
            promotion.startDate = startDate;

        if (endDate !== undefined)
            promotion.endDate = endDate;

        if (isActive !== undefined)
            promotion.isActive = isActive;

        if (showOnHome !== undefined)
            promotion.showOnHome = showOnHome;

        await promotion.save();

        res.status(200).json({
            message: "Promotion updated successfully",
            promotion
        });

    } catch (error) {
        console.error("Update promotion error:", error);

        res.status(500).json({
            message: "Failed to update promotion",
            error: error.message
        });
    }
};


// ==========================================
// DELETE PROMOTION - ADMIN
// ==========================================
const deletePromotion = async (req, res) => {
    try {
        const { id } = req.params;

        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({
                message: "Promotion not found"
            });
        }

        await promotion.deleteOne();

        res.status(200).json({
            message: "Promotion deleted successfully"
        });

    } catch (error) {
        console.error("Delete promotion error:", error);

        res.status(500).json({
            message: "Failed to delete promotion",
            error: error.message
        });
    }
};


// ==========================================
// TOGGLE PROMOTION ACTIVE STATUS - ADMIN
// ==========================================
const togglePromotion = async (req, res) => {
    try {
        const { id } = req.params;

        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({
                message: "Promotion not found"
            });
        }

        promotion.isActive = !promotion.isActive;

        await promotion.save();

        res.status(200).json({
            message: promotion.isActive
                ? "Promotion activated"
                : "Promotion deactivated",
            promotion
        });

    } catch (error) {
        console.error("Toggle promotion error:", error);

        res.status(500).json({
            message: "Failed to toggle promotion",
            error: error.message
        });
    }
};


module.exports = {
    createPromotion,
    getPromotions,
    getActivePromotion,
    updatePromotion,
    deletePromotion,
    togglePromotion
};