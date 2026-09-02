const express = require("express");
const router = express.Router();

const {
    getSmartAssistantContext
} = require("../services/smartAssistantContextService");


// ======================================================
// 🤖 SMART ASSISTANT — USER CONTEXT API
// ======================================================

router.get(
    "/:phone",
    async (req, res) => {

        try {

            const phone =
                req.params.phone;


            // ==================================================
            // GET SMART ASSISTANT CONTEXT
            // ==================================================

            const result =
                await getSmartAssistantContext(
                    phone
                );


            // ==================================================
            // RESPONSE
            // ==================================================

            return res.json({

                success: true,

                ...result

            });

        }


        // ==================================================
        // ERROR
        // ==================================================

        catch (error) {

            console.error(
                "❌ SMART ASSISTANT CONTEXT ERROR:",
                error
            );


            if (
                error.message ===
                "شماره کاربر معتبر نیست."
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        error.message

                });

            }


            if (
                error.message ===
                "کاربر پیدا نشد."
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        error.message

                });

            }


            return res.status(500).json({

                success: false,

                message:
                    "خطا در دریافت اطلاعات دستیار هوشمند."

            });

        }

    }
);


module.exports = router;