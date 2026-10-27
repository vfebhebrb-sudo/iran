const { GoogleGenerativeAI } = require("@google/generative-ai");

// =================================================
// GEMINI CLIENT
// =================================================

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =================================================
// MODEL POOL (اسم‌هایی که تو حسابت وجود ندارن خودکار رد می‌شن)
// =================================================

const MODEL_NAMES = [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b"
];

const models = MODEL_NAMES.map(name => ({
    name,
    model: genAI.getGenerativeModel({ model: name })
}));

// =================================================
// HELPERS
// =================================================

const DEFAULT_TIMEOUT_MS = 25000;

// خطاهایی که امتحان مدل بعدی هم کمکی نمی‌کنه
function isFatal(error) {
    const status = error && error.status;
    if (status === 401 || status === 403) return true;
    return /API key|PERMISSION_DENIED|blocked|SAFETY|PROHIBITED/i.test(
        String((error && error.message) || "")
    );
}

function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(
            () => reject(new Error("Gemini timeout after " + ms + "ms")),
            ms
        );
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// =================================================
// TEXT AI
//
// askGemini(text)                      ← مثل قبل
// askGemini(text, {                    ← حالت جدید (اختیاری)
//     systemInstruction: "...",
//     temperature: 1,
//     maxOutputTokens: 1024,
//     json: true,
//     timeoutMs: 20000
// })
// =================================================

async function askGemini(text, options = {}) {

    const {
        systemInstruction,
        temperature,
        maxOutputTokens,
        json = false,
        timeoutMs = DEFAULT_TIMEOUT_MS
    } = options;

    const custom =
        systemInstruction !== undefined ||
        temperature !== undefined ||
        maxOutputTokens !== undefined ||
        json;

    for (const item of models) {

        try {

            console.log("🧠 TRY GEMINI MODEL:", item.name);

            let model = item.model;

            if (custom) {

                const generationConfig = {};

                if (temperature !== undefined) generationConfig.temperature = temperature;
                if (maxOutputTokens !== undefined) generationConfig.maxOutputTokens = maxOutputTokens;
                if (json) generationConfig.responseMimeType = "application/json";

                model = genAI.getGenerativeModel({
                    model: item.name,
                    ...(systemInstruction ? { systemInstruction } : {}),
                    generationConfig
                });

            }

            const result = await withTimeout(
                model.generateContent(text),
                timeoutMs
            );

            const output = result.response.text();

            if (output && output.trim()) {

                console.log("✅ USING GEMINI MODEL:", item.name);

                return output;

            }

        }
        catch (error) {

            console.log("❌ GEMINI MODEL FAILED:", item.name);
            console.log("   ERROR:", error.message);

            if (isFatal(error)) {

                console.log("⛔ FATAL ERROR, STOP TRYING OTHER MODELS");
                break;

            }

        }

    }

    console.log("🚨 ALL GEMINI MODELS FAILED");

    return null;

}

// =================================================
// PDF AI (بدون تغییر)
// =================================================

async function askGeminiPdf(pdfBuffer, prompt) {

    for (const item of models) {

        try {

            console.log("📄 TRY GEMINI PDF MODEL:", item.name);

            const result = await item.model.generateContent([
                { text: prompt },
                {
                    inlineData: {
                        mimeType: "application/pdf",
                        data: pdfBuffer.toString("base64")
                    }
                }
            ]);

            const output = result.response.text();

            if (output && output.trim()) {

                console.log("✅ USING GEMINI PDF MODEL:", item.name);

                return output;

            }

        }
        catch (error) {

            console.log("❌ GEMINI PDF MODEL FAILED:", item.name);
            console.log("   ERROR:", error.message);

        }

    }

    console.log("🚨 ALL GEMINI PDF MODELS FAILED");

    return null;

}

// =================================================
// EXPORT
// =================================================

module.exports = askGemini;

module.exports.askGeminiPdf = askGeminiPdf;