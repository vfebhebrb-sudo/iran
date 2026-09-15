const PlannerAISettings = require("../models/plannerAISettings.model");

// =========================================================
// GEMINI
// =========================================================

async function generateWithGemini({ apiKey, model, prompt }) {

    const { GoogleGenAI } = require("@google/genai");

    const ai = new GoogleGenAI({
        apiKey
    });

    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });

    return response.text;
}


// =========================================================
// OPENAI
// =========================================================

async function generateWithOpenAI({ apiKey, model, prompt }) {

    const OpenAI = require("openai");

    const client = new OpenAI({
        apiKey
    });

    const response = await client.responses.create({
        model,
        input: prompt
    });

    return response.output_text;
}


// =========================================================
// SETTINGS
// =========================================================

async function getPlannerSettings() {

    let settings = await PlannerAISettings.findOne();

    if (!settings) {
        settings = await PlannerAISettings.create({});
    }

    return settings;
}


// =========================================================
// TEST CONNECTION
// =========================================================

async function testConnection() {

    const settings = await getPlannerSettings();

    if (!settings.enabled) {
        const error = new Error("Planner AI is disabled");
        error.code = "PLANNER_AI_DISABLED";
        throw error;
    }

    let result;

    const testPrompt = `
You are testing an AI connection.

Reply with exactly:
PLANNER_AI_OK
`;

    if (settings.provider === "gemini") {

        if (!settings.gemini.apiKey) {
            const error = new Error(
                "Gemini API key is not configured"
            );

            error.code = "GEMINI_API_KEY_NOT_CONFIGURED";
            throw error;
        }

        result = await generateWithGemini({
            apiKey: settings.gemini.apiKey,
            model: settings.gemini.model,
            prompt: testPrompt
        });

    } else if (settings.provider === "openai") {

        if (!settings.openai.apiKey) {
            const error = new Error(
                "OpenAI API key is not configured"
            );

            error.code = "OPENAI_API_KEY_NOT_CONFIGURED";
            throw error;
        }

        result = await generateWithOpenAI({
            apiKey: settings.openai.apiKey,
            model: settings.openai.model,
            prompt: testPrompt
        });

    } else {

        const error = new Error(
            "Unsupported AI provider"
        );

        error.code = "UNSUPPORTED_AI_PROVIDER";
        throw error;
    }

    return {
        success: true,
        provider: settings.provider,
        model:
            settings.provider === "gemini"
                ? settings.gemini.model
                : settings.openai.model,
        response: result
    };
}


// =========================================================
// DAILY PLAN
// =========================================================

async function generateDailyPlan({ context = {} } = {}) {

    const settings = await getPlannerSettings();

    if (!settings.enabled) {
        const error = new Error(
            "Planner AI is disabled"
        );

        error.code = "PLANNER_AI_DISABLED";
        throw error;
    }

    let apiKey;
    let model;

    if (settings.provider === "gemini") {

        apiKey = settings.gemini.apiKey;
        model = settings.gemini.model;

        if (!apiKey) {
            const error = new Error(
                "Gemini API key is not configured"
            );

            error.code = "GEMINI_API_KEY_NOT_CONFIGURED";
            throw error;
        }

    } else if (settings.provider === "openai") {

        apiKey = settings.openai.apiKey;
        model = settings.openai.model;

        if (!apiKey) {
            const error = new Error(
                "OpenAI API key is not configured"
            );

            error.code = "OPENAI_API_KEY_NOT_CONFIGURED";
            throw error;
        }

    } else {

        const error = new Error(
            "Unsupported AI provider"
        );

        error.code = "UNSUPPORTED_AI_PROVIDER";
        throw error;
    }


    const prompt = `
تو یک هوش مصنوعی تخصصی برای برنامه‌ریزی روزانه مطالعه هستی.

وظیفه تو این است که بر اساس اطلاعات زیر، یک برنامه روزانه منطقی و قابل اجرا تولید کنی.

اطلاعات برنامه‌ریزی:
${JSON.stringify(context, null, 2)}

قوانین:

1. برنامه را واقع‌بینانه تنظیم کن.
2. برنامه‌های ثابت کاربر را در نظر بگیر.
3. اتفاقات امروز را در برنامه لحاظ کن.
4. بین فعالیت‌های سنگین استراحت مناسب قرار بده.
5. زمان‌ها نباید با هم تداخل داشته باشند.
6. برنامه باید بر اساس تاریخ امروز باشد.
7. فقط JSON معتبر برگردان.
8. هیچ Markdown یا توضیح خارج از JSON ننویس.

ساختار خروجی دقیقاً باید این باشد:

{
  "date": "YYYY-MM-DD",
  "schedule": [
    {
      "start": "HH:MM",
      "end": "HH:MM",
      "title": "عنوان",
      "description": "توضیح کوتاه",
      "type": "study"
    }
  ],
  "notes": [],
  "conflicts": []
}

مقدار type فقط یکی از این موارد باشد:

study
break
event
other
`;

    let result;

    if (settings.provider === "gemini") {

        result = await generateWithGemini({
            apiKey,
            model,
            prompt
        });

    } else {

        result = await generateWithOpenAI({
            apiKey,
            model,
            prompt
        });
    }

    return result;
}


module.exports = {
    generateDailyPlan,
    testConnection,
    getPlannerSettings
};