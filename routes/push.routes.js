
// ======================================================
// PUSH NOTIFICATION ROUTES
// ======================================================

const express = require("express");

const router =
    express.Router();


// ======================================================
// MODELS
// ======================================================

const PushSubscription =
    require("../models/PushSubscription");


// ======================================================
// AUTH
// ======================================================

const authenticateUser =
    require("../middleware/auth");


// ======================================================
// SAVE / UPDATE PUSH SUBSCRIPTION
// ======================================================

router.post(
    "/subscribe",
    authenticateUser,
    async (req, res) => {

        try {

            const {
                subscription
            } = req.body;


            // ------------------------------------------
            // بررسی Subscription
            // ------------------------------------------

            if (!subscription) {

                return res.status(400).json({

                    success: false,

                    message:
                        "اطلاعات Push ارسال نشده است"

                });

            }


            // ------------------------------------------
            // بررسی Endpoint
            // ------------------------------------------

            if (
                !subscription.endpoint
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Endpoint ارسال نشده است"

                });

            }


            // ------------------------------------------
            // بررسی Keys
            // ------------------------------------------

            if (
                !subscription.keys ||
                !subscription.keys.p256dh ||
                !subscription.keys.auth
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "کلیدهای Push ناقص هستند"

                });

            }


            // ------------------------------------------
            // User ID از JWT
            // ------------------------------------------

            const userId =
                req.user.userId;


            // ------------------------------------------
            // ذخیره یا بروزرسانی
            // ------------------------------------------

            const savedSubscription =
                await PushSubscription.findOneAndUpdate(

                    {
                        endpoint:
                            subscription.endpoint
                    },

                    {

                        $set: {

                            userId,

                            endpoint:
                                subscription.endpoint,

                            keys: {

                                p256dh:
                                    subscription.keys.p256dh,

                                auth:
                                    subscription.keys.auth

                            },

                            userAgent:
                                req.headers["user-agent"] || "",

                            lastUsedAt:
                                new Date(),

                            active: true

                        }

                    },

                    {

                        new: true,

                        upsert: true,

                        setDefaultsOnInsert: true

                    }

                );


            // ------------------------------------------
            // Log
            // ------------------------------------------

            console.log(
                "🔔 PUSH SUBSCRIPTION SAVED:",
                userId
            );


            // ------------------------------------------
            // Response
            // ------------------------------------------

            return res.json({

                success: true,

                message:
                    "Push Notification فعال شد"

            });

        }


        catch (error) {

            console.error(
                "PUSH SUBSCRIBE ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "خطا در ذخیره Push Subscription"

            });

        }

    }
);


// ======================================================
// REMOVE PUSH SUBSCRIPTION
// ======================================================

router.delete(
    "/unsubscribe",
    authenticateUser,
    async (req, res) => {

        try {

            const {
                endpoint
            } = req.body;


            if (!endpoint) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Endpoint ارسال نشده است"

                });

            }


            // ------------------------------------------
            // فقط Subscription همین کاربر
            // ------------------------------------------

            await PushSubscription.findOneAndUpdate(

                {

                    endpoint,

                    userId:
                        req.user.userId

                },

                {

                    $set: {

                        active: false

                    }

                }

            );


            console.log(
                "🔕 PUSH SUBSCRIPTION DISABLED:",
                req.user.userId
            );


            return res.json({

                success: true,

                message:
                    "Push Notification غیرفعال شد"

            });

        }


        catch (error) {

            console.error(
                "PUSH UNSUBSCRIBE ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "خطا در غیرفعال کردن Push"

            });

        }

    }
);


// ======================================================
// GET CURRENT USER PUSH STATUS
// ======================================================

router.get(
    "/status",
    authenticateUser,
    async (req, res) => {

        try {

            const subscriptions =
                await PushSubscription.find({

                    userId:
                        req.user.userId,

                    active: true

                })
                .select(
                    "endpoint userAgent createdAt lastUsedAt"
                );


            return res.json({

                success: true,

                enabled:
                    subscriptions.length > 0,

                count:
                    subscriptions.length

            });

        }


        catch (error) {

            console.error(
                "PUSH STATUS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "خطا در دریافت وضعیت Push"

            });

        }

    }
);


// ======================================================
// EXPORT
// ======================================================

module.exports =
    router;

