const express = require("express");

const {
    getSettings,
    updateSettings,
    testConnection
} = require("../controllers/plannerAI.controller");

const {
    generateDailyPlan
} = require("../services/plannerAI.service");


const router = express.Router();


// =========================================================
// SETTINGS
// =========================================================

router.get(
    "/settings",
    getSettings
);


router.put(
    "/settings",
    updateSettings
);


// =========================================================
// TEST AI CONNECTION
// =========================================================

router.post(
    "/test",
    testConnection
);


// =========================================================
// GENERATE DAILY PLAN
// =========================================================

router.post(
    "/generate",
    async (req, res) => {

        try {

            const {
                context = {}
            } = req.body;


            const result =
                await generateDailyPlan({
                    context
                });


            let parsedResult;


            try {

                parsedResult =
                    JSON.parse(result);

            } catch (parseError) {

                console.error(
                    "Planner AI returned invalid JSON:",
                    result
                );

                return res.status(502).json({

                    success: false,

                    message:
                        "هوش مصنوعی خروجی JSON معتبر برنگرداند"
                });
            }


            res.json({

                success: true,

                data: parsedResult
            });


        } catch (error) {

            console.error(
                "Planner AI generate error:",
                error
            );


            const messages = {

                PLANNER_AI_DISABLED:
                    "Planner AI غیرفعال است",

                GEMINI_API_KEY_NOT_CONFIGURED:
                    "کلید API جمنای تنظیم نشده است",

                OPENAI_API_KEY_NOT_CONFIGURED:
                    "کلید API اوپن‌ای‌آی تنظیم نشده است",

                UNSUPPORTED_AI_PROVIDER:
                    "ارائه‌دهنده هوش مصنوعی نامعتبر است"
            };


            res.status(400).json({

                success: false,

                message:
                    messages[error.code] ||
                    "خطا در تولید برنامه روزانه",

                code:
                    error.code ||
                    "PLANNER_AI_GENERATE_FAILED"
            });
        }
    }
);


module.exports = router;