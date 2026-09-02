
const express = require("express");
const router = express.Router();

const User = require("../models/User");


/* =====================================================
   DEFAULT AI SETTINGS
===================================================== */

const defaultSettings = {

    enabled: true,

    accessLevel: "study",

    profile: true,

    studyPlans: true,

    performance: false,

    actions: false

};


/* =====================================================
   GET AI SETTINGS
===================================================== */

router.get(
    "/:phone",
    async (req, res) => {

        try {

            const phone =
                req.params.phone;


            if(
                !phone ||
                typeof phone !== "string"
            ){

                return res.status(400).json({

                    success: false,

                    message:
                        "شماره کاربر معتبر نیست."

                });

            }


            const user =
                await User.findOne({
                    phone: phone
                }).select(
                    "aiSettings"
                );


            if(!user){

                return res.status(404).json({

                    success: false,

                    message:
                        "کاربر پیدا نشد."

                });

            }


            const settings = {

                ...defaultSettings,

                ...(user.aiSettings
                    ? user.aiSettings.toObject
                        ? user.aiSettings.toObject()
                        : user.aiSettings
                    : {})

            };


            return res.json({

                success: true,

                settings: settings

            });

        }
        catch(error){

            console.error(
                "❌ GET AI SETTINGS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "خطا در دریافت تنظیمات دستیار."

            });

        }

    }
);


/* =====================================================
   UPDATE AI SETTINGS
===================================================== */

router.put(
    "/:phone",
    async (req, res) => {

        try {

            const phone =
                req.params.phone;


            if(
                !phone ||
                typeof phone !== "string"
            ){

                return res.status(400).json({

                    success: false,

                    message:
                        "شماره کاربر معتبر نیست."

                });

            }


            const user =
                await User.findOne({
                    phone: phone
                });


            if(!user){

                return res.status(404).json({

                    success: false,

                    message:
                        "کاربر پیدا نشد."

                });

            }


            const {

                enabled,
                accessLevel,
                profile,
                studyPlans,
                performance,
                actions

            } = req.body;


            /* =========================================
               VALIDATE ACCESS LEVEL
            ========================================= */

            const allowedAccessLevels = [

                "limited",
                "study",
                "analysis",
                "full"

            ];


            if(
                accessLevel !== undefined &&
                !allowedAccessLevels.includes(
                    accessLevel
                )
            ){

                return res.status(400).json({

                    success: false,

                    message:
                        "سطح دسترسی نامعتبر است."

                });

            }


            /* =========================================
               UPDATE ONLY ALLOWED FIELDS
            ========================================= */

            if(
                !user.aiSettings
            ){

                user.aiSettings = {

                    ...defaultSettings

                };

            }


            if(
                typeof enabled === "boolean"
            ){

                user.aiSettings.enabled =
                    enabled;

            }


            if(
                accessLevel !== undefined
            ){

                user.aiSettings.accessLevel =
                    accessLevel;

            }


            if(
                typeof profile === "boolean"
            ){

                user.aiSettings.profile =
                    profile;

            }


            if(
                typeof studyPlans === "boolean"
            ){

                user.aiSettings.studyPlans =
                    studyPlans;

            }


            if(
                typeof performance === "boolean"
            ){

                user.aiSettings.performance =
                    performance;

            }


            if(
                typeof actions === "boolean"
            ){

                user.aiSettings.actions =
                    actions;

            }


            await user.save();


            return res.json({

                success: true,

                message:
                    "تنظیمات دستیار ذخیره شد.",

                settings: {

                    ...defaultSettings,

                    ...(user.aiSettings.toObject
                        ? user.aiSettings.toObject()
                        : user.aiSettings)

                }

            });

        }
        catch(error){

            console.error(
                "❌ UPDATE AI SETTINGS ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "خطا در ذخیره تنظیمات دستیار."

            });

        }

    }
);


module.exports = router;

