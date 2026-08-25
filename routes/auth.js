

const express = require("express");
const router = express.Router();

console.log("AUTH ROUTE LOADED");

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const rubikaBot = require("../rubika/bot");


// ======================================================
// ارسال کد OTP
// ======================================================

router.post("/send-otp", async (req, res) => {

    try {

        const { phone, chatId } = req.body;


        if (!phone || !chatId) {

            return res.status(400).json({
                message: "شماره تلفن و شناسه روبیکا وارد نشده است"
            });

        }


        // ساخت کد ۴ رقمی

        const otp =
            Math.floor(
                1000 +
                Math.random() * 9000
            ).toString();


        // زمان انقضا: ۲ دقیقه

        const otpExpire =
            new Date(
                Date.now() +
                2 * 60 * 1000
            );


        let user =
            await User.findOne({
                phone
            });


            if (user) {


                user.otp = otp;

                user.otpExpire = otpExpire;

                user.chatId = chatId;


            }

        else {

                user =
                new User({

                    phone,

                    chatId,

                    otp,

                    otpExpire

                });

        }


        await user.save();


        // فعلاً فقط برای تست

await rubikaBot.sendOTP(
    chatId,
    otp
);


        res.json({

            message:
                "کد تایید ارسال شد"

        });


    }

    catch (error) {

        console.log(
            "SEND OTP ERROR:"
        );

        console.log(error);


        res.status(500).json({

            message:
                error.message

        });

    }

});


// ======================================================
// تایید کد OTP
// ======================================================

router.post("/verify-otp", async (req, res) => {

    try {

        const {
            phone,
            otp,
            fullname,
            email,
            password
        } = req.body;


        if (!phone || !otp) {

            return res.status(400).json({

                message:
                    "اطلاعات ناقص است"

            });

        }


        const user =
            await User.findOne({
                phone
            });


        if (!user) {

            return res.status(404).json({

                message:
                    "کاربر پیدا نشد"

            });

        }


        // ==================================================
        // بررسی انقضای OTP
        // ==================================================

        if (
            !user.otpExpire ||
            user.otpExpire < new Date()
        ) {

            return res.status(400).json({

                message:
                    "کد منقضی شده است"

            });

        }


        // ==================================================
        // بررسی کد
        // ==================================================

        if (user.otp !== otp) {

            return res.status(400).json({

                message:
                    "کد اشتباه است"

            });

        }


        // ==================================================
        // تایید کاربر
        // ==================================================

        user.fullname =
            fullname;

        user.email =
            email;

        user.password =
            password;

        user.verified =
            true;

        user.otp =
            null;

        user.otpExpire =
            null;


        await user.save();


        res.json({

            message:
                "کد تایید شد"

        });


    }

    catch (error) {

        console.log(
            "VERIFY OTP ERROR:"
        );

        console.log(error);


        res.status(500).json({

            message:
                "خطای سرور"

        });

    }

});


// ======================================================
// LOGIN
// ورود با ایمیل یا شماره تلفن
// ======================================================

router.post("/login", async (req, res) => {

    try {

        const {
            identity,
            password
        } = req.body;


        // ==================================================
        // بررسی اطلاعات ورود
        // ==================================================

        if (
            !identity ||
            !password
        ) {

            return res.status(400).json({

                message:
                    "اطلاعات ورود ناقص است"

            });

        }


        let user;


        // ==================================================
        // ورود با ایمیل
        // ==================================================

        if (
            identity.includes("@")
        ) {

            user =
                await User.findOne({

                    email:
                        identity

                });

        }


        // ==================================================
        // ورود با شماره تلفن
        // ==================================================

        else {

            user =
                await User.findOne({

                    phone:
                        identity

                });

        }


        // ==================================================
        // کاربر پیدا نشد
        // ==================================================

        if (!user) {

            return res.status(404).json({

                message:
                    "کاربر پیدا نشد"

            });

        }


        // ==================================================
        // بررسی تایید حساب
        // ==================================================

        if (!user.verified) {

            return res.status(403).json({

                message:
                    "شماره تلفن تایید نشده است"

            });

        }


        // ==================================================
        // بررسی رمز عبور
        // ==================================================

        if (
            user.password !== password
        ) {

            return res.status(401).json({

                message:
                    "رمز عبور اشتباه است"

            });

        }


        // ==================================================
        // بررسی JWT_SECRET
        // ==================================================

        if (
            !process.env.JWT_SECRET
        ) {

            console.error(
                "JWT_SECRET is not defined in .env"
            );


            return res.status(500).json({

                message:
                    "تنظیمات امنیتی سرور کامل نیست"

            });

        }


        // ==================================================
        // ساخت JWT
        // ==================================================

        const token =
            jwt.sign(

                {

                    userId:
                        user._id.toString()

                },

                process.env.JWT_SECRET,

                {

                    expiresIn:
                        "7d"

                }

            );


        // ==================================================
        // پاسخ موفق Login
        // ==================================================

        res.json({

            message:
                "ورود موفق بود",


            token,

            user: {

                id:
                    user._id,

                fullname:
                    user.fullname,

                email:
                    user.email,

                phone:
                    user.phone,

                chatId:
                    user.chatId

            }

        });


    }

    catch (error) {

        console.log(
            "LOGIN ERROR:"
        );

        console.log(error);


        res.status(500).json({

            message:
                "خطای سرور"

        });

    }

});


// ======================================================
// خروجی Route
// ======================================================

module.exports = router;