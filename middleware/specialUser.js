// ======================================================
// SPECIAL USER MIDDLEWARE
// ======================================================

const User = require("../models/User");


// ======================================================
// CHECK SPECIAL USER
// ======================================================

async function specialUser(req, res, next) {

    try {

        // ------------------------------------------
        // بررسی اینکه کاربر احراز هویت شده باشد
        // ------------------------------------------

        if (!req.user || !req.user.userId) {

            return res.status(401).json({

                success: false,

                message:
                    "کاربر احراز هویت نشده است"

            });

        }


        // ------------------------------------------
        // پیدا کردن کاربر
        // ------------------------------------------

        const user =
            await User.findById(
                req.user.userId
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "کاربر پیدا نشد"

            });

        }


        // ------------------------------------------
        // شماره کاربر ویژه
        // ------------------------------------------

        const specialPhone =
            process.env.SPECIAL_USER_PHONE;


        // ------------------------------------------
        // بررسی شماره
        // ------------------------------------------

        if (
            user.phone !== specialPhone
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "شما اجازه انجام این عملیات را ندارید"

            });

        }


        // ------------------------------------------
        // کاربر ویژه است
        // ------------------------------------------

        req.specialUser = user;

        next();

    }


    catch (error) {

        console.error(
            "SPECIAL USER MIDDLEWARE ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "خطای سرور"

        });

    }

}


// ======================================================
// EXPORT
// ======================================================

module.exports =
    specialUser;