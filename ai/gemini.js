try { require("dotenv").config(); } catch (e) { /* dotenv نصب نیست یا جای دیگه لود شده */ }

const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold
} = require("@google/generative-ai");

// =================================================
// KEYS
// =================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GEMINI_API_KEY) console.log("⚠️  GEMINI_API_KEY تو .env پیدا نشد");
if (!GROQ_API_KEY) console.log("ℹ️  GROQ_API_KEY ست نشده، پشتیبان Groq غیرفعاله");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "missing");

// =================================================
// MODEL POOL
// قوی‌ترین اول، سبک‌ترین آخر. اگه سهمیه‌ی یکی تموم شد خودکار می‌ره بعدی.
// اسمی که تو حسابت نباشه رد می‌شه.
// =================================================

const MODEL_NAMES = [
    "gemini-3.5-flash",
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite"
];

const GROQ_MODEL = "llama-3.3-70b-versatile";

// فیلتر ایمنی رو شل می‌کنیم تا تو چت گروهی بی‌دلیل جواب بلاک نشه
const SAFETY_SETTINGS = [
    HarmCategory.HARM_CATEGORY_HARASSMENT,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT
].map(category => ({
    category,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
}));

// =================================================
// HELPERS
// =================================================

const DEFAULT_TIMEOUT_MS = 25000;

function getModel(name, options = {}) {
    const { systemInstruction, temperature, maxOutputTokens, json } = options;

    const generationConfig = {};
    if (temperature !== undefined) generationConfig.temperature = temperature;
    if (maxOutputTokens !== undefined) generationConfig.maxOutputTokens = maxOutputTokens;
    if (json) generationConfig.responseMimeType = "application/json";

    return genAI.getGenerativeModel({
        model: name,
        safetySettings: SAFETY_SETTINGS,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig
    });
}

// خطاهایی که امتحان مدل بعدی هم کمکی نمی‌کنه
function isFatal(error) {
    const status = error && error.status;
    if (status === 429 || status === 404 || status === 503) return false;
    if (status === 401 || status === 403) return true;
    return /API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(
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
// GROQ (پشتیبان، وقتی همه‌ی مدل‌های Gemini جواب ندادن)
// =================================================

async function askGroq(text, options = {}) {
    if (!GROQ_API_KEY) return null;

    const {
        systemInstruction,
        temperature = 1,
        maxOutputTokens = 1024,
        json = false,
        timeoutMs = DEFAULT_TIMEOUT_MS
    } = options;

    try {
        console.log("🧠 TRY GROQ MODEL:", GROQ_MODEL);

        const system = [
            systemInstruction,
            json ? "Respond only with valid JSON." : null
        ].filter(Boolean).join("\n\n");

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + GROQ_API_KEY
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                temperature,
                max_tokens: maxOutputTokens,
                ...(json ? { response_format: { type: "json_object" } } : {}),
                messages: [
                    ...(system ? [{ role: "system", content: system }] : []),
                    { role: "user", content: text }
                ]
            }),
            signal: AbortSignal.timeout(timeoutMs)
        });

        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();
        const output = data.choices?.[0]?.message?.content;

        if (output && output.trim()) {
            console.log("✅ USING GROQ MODEL:", GROQ_MODEL);
            return output;
        }
    }
    catch (error) {
        console.log("❌ GROQ FAILED:", error.message);
    }

    return null;
}

// =================================================
// TEXT AI
//
// askGemini(text)
// askGemini(text, {
//     systemInstruction: "...",   ← شخصیت ربات
//     temperature: 1,
//     maxOutputTokens: 1024,
//     json: true,
//     timeoutMs: 20000
// })
// =================================================

async function askGemini(text, options = {}) {

    const { timeoutMs = DEFAULT_TIMEOUT_MS } = options;

    for (const name of MODEL_NAMES) {

        try {

            console.log("🧠 TRY GEMINI MODEL:", name);

            const model = getModel(name, options);

            const result = await withTimeout(
                model.generateContent(text),
                timeoutMs
            );

            const output = result.response.text();

            if (output && output.trim()) {

                console.log("✅ USING GEMINI MODEL:", name);

                return output;

            }

        }
        catch (error) {

            console.log("❌ GEMINI MODEL FAILED:", name);
            console.log("   ERROR:", error.message);

            if (isFatal(error)) {

                console.log("⛔ FATAL ERROR, STOP TRYING OTHER GEMINI MODELS");
                break;

            }

        }

    }

    console.log("🚨 ALL GEMINI MODELS FAILED, TRYING GROQ");

    return await askGroq(text, options);

}

// =================================================
// PDF AI (فقط Gemini، Groq فایل PDF نمی‌خونه)
// =================================================

async function askGeminiPdf(pdfBuffer, prompt, options = {}) {

    const { timeoutMs = 60000 } = options;

    for (const name of MODEL_NAMES) {

        try {

            console.log("📄 TRY GEMINI PDF MODEL:", name);

            const model = getModel(name, options);

            const result = await withTimeout(
                model.generateContent([
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: "application/pdf",
                            data: pdfBuffer.toString("base64")
                        }
                    }
                ]),
                timeoutMs
            );

            const output = result.response.text();

            if (output && output.trim()) {

                console.log("✅ USING GEMINI PDF MODEL:", name);

                return output;

            }

        }
        catch (error) {

            console.log("❌ GEMINI PDF MODEL FAILED:", name);
            console.log("   ERROR:", error.message);

            if (isFatal(error)) break;

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
module.exports.askGroq = askGroq;