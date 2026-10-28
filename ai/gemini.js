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
    "gemini-2.5-flash",
    "gemini-2.5-pro",
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
// TEXT TO SPEECH (ویس روبو)
//
// askGeminiSpeech(text, {
//     voiceName: "Charon",      ← اسم صدا
//     languageCode: "fa-IR",    ← اختیاری؛ خالی = تشخیص خودکار
//     timeoutMs: 30000
// })
//
// خروجی: { pcm: Buffer, rate: 24000, model } یا null
// pcm صدای خام (16-bit، مونو) ـه؛ تبدیلش به ویس تلگرام با roboVoice.js
// =================================================

// اگه TTS_MODEL توی .env بذاری اول اون امتحان می‌شه؛ اسمی که تو حسابت نباشه رد می‌شه
const TTS_MODEL_NAMES = [
    process.env.TTS_MODEL,
    "gemini-3.1-flash-tts-preview",
    "gemini-2.5-flash-preview-tts"
].filter(Boolean);

async function askGeminiSpeech(text, options = {}) {

    if (!GEMINI_API_KEY) return null;

    const {
        voiceName = "Charon",
        languageCode = null,
        timeoutMs = 30000
    } = options;

    const speechConfig = {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } }
    };

    if (languageCode) speechConfig.languageCode = languageCode;

    for (const name of TTS_MODEL_NAMES) {

        try {

            console.log("🎙 TRY GEMINI TTS MODEL:", name);

            const res = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/" + name + ":generateContent",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": GEMINI_API_KEY
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text }] }],
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig
                        }
                    }),
                    signal: AbortSignal.timeout(timeoutMs)
                }
            );

            const data = await res.json().catch(() => null);

            if (!res.ok) {

                const error = new Error(
                    (data && data.error && data.error.message) || "HTTP " + res.status
                );

                error.status = res.status;

                throw error;

            }

            const parts = data?.candidates?.[0]?.content?.parts || [];

            const part = parts.find(p => p.inlineData && p.inlineData.data);

            if (part) {

                console.log("✅ USING GEMINI TTS MODEL:", name);

                const mime = part.inlineData.mimeType || "";

                return {
                    pcm: Buffer.from(part.inlineData.data, "base64"),
                    rate: Number((/rate=(\d+)/.exec(mime) || [])[1]) || 24000,
                    model: name
                };

            }

        }
        catch (error) {

            console.log("❌ GEMINI TTS MODEL FAILED:", name);
            console.log("   ERROR:", error.message);

            if (isFatal(error)) {

                console.log("⛔ FATAL ERROR, STOP TRYING OTHER TTS MODELS");
                break;

            }

        }

    }

    console.log("🚨 ALL GEMINI TTS MODELS FAILED");

    return null;

}

// =================================================
// EXPORT
// =================================================

module.exports = askGemini;

module.exports.askGeminiPdf = askGeminiPdf;
module.exports.askGroq = askGroq;
module.exports.askGeminiSpeech = askGeminiSpeech;