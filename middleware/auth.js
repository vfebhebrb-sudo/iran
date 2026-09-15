
// ======================================================
// AUTH MIDDLEWARE
// JWT Authentication
// ======================================================

const jwt = require("jsonwebtoken");


// ======================================================
// AUTHENTICATE USER
// ======================================================

function authenticateUser(req, res, next) {

    try {

        // ------------------------------------------
        // دریافت Authorization Header
        // ------------------------------------------

        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({

                success: false,

                message:
                    "توکن ارسال نشده است"

            });

        }


        // ------------------------------------------
        // استخراج Token
        // ------------------------------------------

        const parts =
            authHeader.split(" ");


        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "فرمت توکن نامعتبر است"

            });

        }


        const token =
            parts[1];


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "توکن نامعتبر است"

            });

        }


        // ------------------------------------------
        // JWT Secret
        // ------------------------------------------

        if (!process.env.JWT_SECRET) {

            console.error(
                "JWT_SECRET is not defined"
            );

            return res.status(500).json({

                success: false,

                message:
                    "تنظیمات امنیتی سرور کامل نیست"

            });

        }


        // ------------------------------------------
        // Verify JWT
        // ------------------------------------------

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // ------------------------------------------
        // بررسی User ID
        // ------------------------------------------

        if (!decoded.userId) {

            return res.status(401).json({

                success: false,

                message:
                    "شناسه کاربر داخل توکن وجود ندارد"

            });

        }


        // ------------------------------------------
        // قرار دادن اطلاعات کاربر در Request
        // ------------------------------------------

        req.user = {

            userId:
                decoded.userId

        };


        // ------------------------------------------
        // ادامه Route
        // ------------------------------------------

        next();

    }


    catch (error) {

        console.error(
            "AUTH MIDDLEWARE ERROR:",
            error.message
        );


        return res.status(401).json({

            success: false,

            message:
                "احراز هویت نامعتبر است"

        });

    }

}


// ======================================================
// EXPORT
// ======================================================

module.exports =
    authenticateUser;


