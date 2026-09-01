
const express = require("express");
const router = express.Router();

console.log("AUTH ROUTE LOADED");

const User = require("../models/User");
const Counter = require("../models/Counter");

const jwt = require("jsonwebtoken");
const rubikaBot = require("../rubika/bot");


// ======================================================
// ساخت شماره داوطلبی جدید
// ======================================================

async function getNextCandidateNumber() {

    const counter =
        await Counter.findOneAndUpdate(

            {
                name: "candidateNumber"
            },

            {
                $inc: {
                    sequence: 1
                }
            },

            {
                new: true,
                upsert: true
            }

        );


    return String(
        100000 + counter.sequence
    );
}


// ======================================================
// ارسال کد OTP
// ======================================================

router.post("/send-otp", async (req, res) => {

    try {

        const {
            phone,
            chatId
        } = req.body;


        // ==================================================
        // بررسی اطلاعات
        // ==================================================

        if (!phone || !chatId) {

            return res.status(400).json({

                message:
                    "شماره تلفن و شناسه روبیکا وارد نشده است"

            });

        }


        // ==================================================
        // ساخت OTP
        // ==================================================

        const otp =
            Math.floor(
                1000 +
                Math.random() * 9000
            ).toString();


        // ==================================================
        // زمان انقضا
        // 2 دقیقه
        // ==================================================

        const otpExpire =
            new Date(
                Date.now() +
                2 * 60 * 1000
            );


        // ==================================================
        // پیدا کردن کاربر
        // ==================================================

        let user =
            await User.findOne({
                phone
            });


        // ==================================================
        // کاربر قبلاً وجود دارد
        // ==================================================

        if (user) {

            user.otp =
                otp;

            user.otpExpire =
                otpExpire;

            user.chatId =
                chatId;

        }


        // ==================================================
        // کاربر جدید
        // ==================================================

        else {

            user =
                new User({

                    phone,

                    chatId,

                    otp,

                    otpExpire,

                    // هنوز حساب ساخته نشده
                    // کد داوطلبی بعد از تایید OTP ساخته می‌شود
                    candidateNumber: null

                });

        }


        // ==================================================
        // ذخیره کاربر موقت
        // ==================================================

        await user.save();


        // ==================================================
        // ارسال OTP
        // ==================================================

        await rubikaBot.sendOTP(
            chatId,
            otp
        );


        console.log(
            "OTP SENT:",
            phone
        );


        // ==================================================
        // پاسخ
        // ==================================================

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
// ساخت نهایی حساب + اختصاص شماره داوطلبی
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


        // ==================================================
        // بررسی اطلاعات
        // ==================================================

        if (!phone || !otp) {

            return res.status(400).json({

                message:
                    "اطلاعات ناقص است"

            });

        }


        // ==================================================
        // پیدا کردن کاربر
        // ==================================================

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
        // بررسی OTP
        // ==================================================

        if (
            user.otp !== otp
        ) {

            return res.status(400).json({

                message:
                    "کد اشتباه است"

            });

        }


        // ==================================================
        // تکمیل اطلاعات حساب
        // ==================================================

        user.fullname =
            fullname || null;

        user.email =
            email || null;

        user.password =
            password || null;


        // ==================================================
        // اختصاص شماره داوطلبی
        // فقط هنگام ساخت حساب
        // ==================================================

        if (!user.candidateNumber) {

            user.candidateNumber =
                await getNextCandidateNumber();

        }


        // ==================================================
        // تایید نهایی حساب
        // ==================================================

        user.verified =
            true;


        // ==================================================
        // پاک کردن OTP
        // ==================================================

        user.otp =
            null;

        user.otpExpire =
            null;


        // ==================================================
        // ذخیره حساب نهایی
        // ==================================================

        await user.save();


        console.log(
            "ACCOUNT CREATED:",
            user.phone
        );

        console.log(
            "CANDIDATE NUMBER:",
            user.candidateNumber
        );


        // ==================================================
        // پاسخ موفق
        // ==================================================

        res.json({

            message:
                "حساب با موفقیت ساخته شد",

            user: {

                id:
                    user._id,

                fullname:
                    user.fullname,

                email:
                    user.email,

                phone:
                    user.phone,

                candidateNumber:
                    user.candidateNumber,

                chatId:
                    user.chatId

            }

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
        // ثبت آخرین ورود
        // ==================================================

        user.lastLoginAt =
            new Date();


        await user.save();


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

                candidateNumber:
                    user.candidateNumber,

                studyDays:
                    user.studyDays,

                league:
                    user.league,

                completedExams:
                    user.completedExams,

                previousScore:
                    user.previousScore,

                totalQuestionsAnswered:
                    user.totalQuestionsAnswered,

                totalCorrectAnswers:
                    user.totalCorrectAnswers,

                totalWrongAnswers:
                    user.totalWrongAnswers,

                totalStudyMinutes:
                    user.totalStudyMinutes,

                targetField:
                    user.targetField,

                targetUniversity:
                    user.targetUniversity,

                profileImage:
                    user.profileImage,

                bio:
                    user.bio,

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
// دریافت اطلاعات کاربر فعلی
// ======================================================

router.get("/me", async (req, res) => {

    try {

        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({

                message:
                    "توکن ارسال نشده است"

            });

        }


        const token =
            authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({

                message:
                    "توکن نامعتبر است"

            });

        }


        // ==================================================
        // بررسی JWT
        // ==================================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // ==================================================
        // پیدا کردن کاربر
        // ==================================================

        const user =
            await User.findById(
                decoded.userId
            )
            .select(
                "-password -otp -otpExpire"
            );


        if (!user) {

            return res.status(404).json({

                message:
                    "کاربر پیدا نشد"

            });

        }


        // ==================================================
        // ارسال اطلاعات
        // ==================================================

        res.json({

            user

        });

    }


    catch (error) {

        console.log(
            "ME ROUTE ERROR:"
        );

        console.log(error);


        return res.status(401).json({

            message:
                "احراز هویت نامعتبر است"

        });

    }

});


// ======================================================
// خروجی Route
// ======================================================

module.exports = router;
