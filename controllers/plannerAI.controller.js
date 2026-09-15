const PlannerAISettings = require("../models/plannerAISettings.model");


// =========================================================
// GET SETTINGS
// =========================================================

async function getSettings(req, res) {

    try {

        let settings = await PlannerAISettings.findOne();

        if (!settings) {
            settings = await PlannerAISettings.create({});
        }

        res.json({
            success: true,

            data: {
                enabled: settings.enabled,

                provider: settings.provider,

                gemini: {
                    configured: Boolean(
                        settings.gemini.apiKey
                    ),
                    model: settings.gemini.model
                },

                openai: {
                    configured: Boolean(
                        settings.openai.apiKey
                    ),
                    model: settings.openai.model
                }
            }
        });

    } catch (error) {

        console.error(
            "Planner AI get settings error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "خطا در دریافت تنظیمات Planner AI"
        });
    }
}


// =========================================================
// UPDATE SETTINGS
// =========================================================

async function updateSettings(req, res) {

    try {

        const {
            enabled,
            provider,
            gemini,
            openai
        } = req.body;


        if (
            provider &&
            !["gemini", "openai"].includes(provider)
        ) {

            return res.status(400).json({
                success: false,
                message: "Provider نامعتبر است"
            });
        }


        let settings =
            await PlannerAISettings.findOne();


        if (!settings) {
            settings =
                new PlannerAISettings();
        }


        if (typeof enabled === "boolean") {
            settings.enabled = enabled;
        }


        if (provider) {
            settings.provider = provider;
        }


        // =====================================================
        // GEMINI
        // =====================================================

        if (gemini) {

            if (
                typeof gemini.apiKey === "string" &&
                gemini.apiKey.trim()
            ) {

                settings.gemini.apiKey =
                    gemini.apiKey.trim();
            }


            if (
                typeof gemini.model === "string" &&
                gemini.model.trim()
            ) {

                settings.gemini.model =
                    gemini.model.trim();
            }
        }


        // =====================================================
        // OPENAI
        // =====================================================

        if (openai) {

            if (
                typeof openai.apiKey === "string" &&
                openai.apiKey.trim()
            ) {

                settings.openai.apiKey =
                    openai.apiKey.trim();
            }


            if (
                typeof openai.model === "string" &&
                openai.model.trim()
            ) {

                settings.openai.model =
                    openai.model.trim();
            }
        }


        await settings.save();


        res.json({
            success: true,
            message: "تنظیمات با موفقیت ذخیره شد"
        });


    } catch (error) {

        console.error(
            "Planner AI update settings error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "خطا در ذخیره تنظیمات Planner AI"
        });
    }
}


// =========================================================
// TEST CONNECTION
// =========================================================

async function testConnection(req, res) {

    try {

        const {
            testConnection: runTest
        } = require("../services/plannerAI.service");

        const result = await runTest();


        res.json({
            success: true,
            message: "اتصال به هوش مصنوعی موفق بود",
            data: result
        });


    } catch (error) {

        console.error(
            "Planner AI test error:",
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
                "تست اتصال ناموفق بود",

            code: error.code || "AI_TEST_FAILED"
        });
    }
}


module.exports = {
    getSettings,
    updateSettings,
    testConnection
};