// ======================================================
// ROBO VOICE — ویس دادن روبو
//
//  ۱) تشخیص درخواست («روبو ویس بده» / «ویس نده»)
//  ۲) صدا ساختن با Gemini TTS (askGeminiSpeech توی ai/gemini.js)
//  ۳) تبدیل صدای خام به OGG/Opus با ffmpeg (فرمت ویس تلگرام)
//  ۴) فرستادن با sendVoice
//
// نیازمندی‌ها:
//   - Node 18+
//   - ffmpeg: نصب روی سرور، یا   npm i ffmpeg-static
//   - GEMINI_API_KEY توی .env (همونی که ai/gemini.js استفاده می‌کنه)
//
// تنظیم‌های اختیاری توی .env:
//   VOICE_ENABLED=0       خاموش کردن کامل
//   TTS_VOICE=Charon      اسم صدای پیش‌فرض (Kore، Puck، Charon، Aoede ...)
//   TTS_VOICE_FEMALE=Kore صدای زنانه (وقتی مالک بگه «با صدای زن»)
//   TTS_VOICE_MALE=...    صدای مردانه (پیش‌فرض: همون TTS_VOICE)
//   VOICE_GENDER_FOR_ALL=1  همه بتونن نوع صدا رو انتخاب کنن (پیش‌فرض: فقط مالک)
//   TTS_LANGUAGE=fa-IR    خالی = زبان خودکار تشخیص داده می‌شه
//   TTS_MODEL=...         مدلِ دلخواه (اول اون امتحان می‌شه)
// ======================================================

const { spawn } = require("child_process");

const { askGeminiSpeech } = require("../ai/gemini");

let FFMPEG = "ffmpeg";

try {
    FFMPEG = require("ffmpeg-static") || "ffmpeg";
}
catch (e) { /* از ffmpegِ نصب‌شده روی سیستم استفاده می‌شه */ }

// ======================================================
// CONFIG
// ======================================================

const VOICE = {

    ENABLED: process.env.VOICE_ENABLED !== "0",

    VOICE_NAME: process.env.TTS_VOICE || "Charon",

    // صدای زنانه: وقتی مالک بگه «با صدای زن ویس بده». هر اسم دیگه‌ی Gemini رو می‌تونی توی .env بذاری
    // (مثلاً Kore، Aoede، Leda، Sulafat، Zephyr)
    VOICE_NAME_FEMALE: process.env.TTS_VOICE_FEMALE || "Kore",

    // صدای مردانه: وقتی مالک بگه «با صدای مرد»؛ پیش‌فرضش همون TTS_VOICE ـه
    VOICE_NAME_MALE: process.env.TTS_VOICE_MALE || process.env.TTS_VOICE || "Charon",

    // انتخابِ نوع صدا فقط برای مالکه. برای همه‌ی اعضا باز بشه: VOICE_GENDER_FOR_ALL=1
    GENDER_FOR_ALL: process.env.VOICE_GENDER_FOR_ALL === "1",

    LANGUAGE: process.env.TTS_LANGUAGE || null,

    // راهنمای لحن برای مدل صدا (خودش خونده نمی‌شه)
    STYLE: "Say the following in casual, natural, friendly spoken Persian, like a close friend sending a voice message in a group chat",

    // حداکثر طول متن: وقتی کسی ویس خواسته / وقتی خودِ روبو می‌خواد ویس بده
    MAX_CHARS_REQUESTED: 700,
    MAX_CHARS_SPONTANEOUS: 300,

    // ویسِ خودخواسته (بدون درخواست)
    SPONTANEOUS: true,

    // حداقل فاصله بین دو ویسِ خودخواسته توی یه چت
    SPONTANEOUS_GAP_MS: 12 * 60 * 1000,

    // هر بار با این احتمال به مدل اجازه‌ی ویس دادن داده می‌شه (خودش هم می‌تونه نخواد)
    OFFER_CHANCE: 0.35

};

function isEnabled() {

    return VOICE.ENABLED && Boolean(process.env.GEMINI_API_KEY);

}

// ======================================================
// REQUEST DETECTION
//   «ویس بده» / «با ویس جواب بده» / «صدات رو بشنوم»  → "yes"
//   «ویس نده» / «ویس نفرست» / «بدون ویس»              → "no"
// ======================================================

function prep(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[\u064B-\u065F\u0640]/g, "")
        .replace(/\u200c/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}

const NOUN = "(?:ویس(?:ی)?|وویس|صوت(?:ی)?|صدا(?:ت)?(?:\\s*رو)?|صداتو|voice)";

const VERB = "(?:بده|بدی|بدین|بدید|بفرست|بفرس|بفرستین|بفرستید|بزار|بذار|بزارین|بزارید|بذارین|بذارید|بزاری|بذاری|بگیر|بگو|بگی|بخون|بخونی|بزن|بنداز|بساز|بیار|درست\\s*کن|ارسال\\s*کن|ضبط\\s*کن|میدی|می\\s*دی|میفرستی|می\\s*فرستی|میذاری|می\\s*ذاری|میزاری|می\\s*زاری|بشنوم|بشنویم|بشنوه)";

const YES = new RegExp(
    `${NOUN}(?:\\s+\\S+){0,3}?\\s*${VERB}` +
    `|${VERB}\\s*(?:یه\\s*|یک\\s*)?${NOUN}` +
    `|(?:با|به)\\s*(?:ویس|صدا)\\s*(?:جواب|بگو|بخون|بفرست)` +
    `|${VERB}\\s*(?:با|به)\\s*(?:ویس|صدا)` +
    `|(?:یه|یک)\\s*ویس`,
    "i"
);

const NO = /ویس\s*(?:نده|نفرست|نگو|نمی\s*خوام|نخوام|نمیخوام|نزن)|بدون\s*ویس|نه\s*ویس|ویس\s*نه|صدا\s*نده|voice\s*(?:off|نه)/i;

function detectRequest(text) {

    const value = prep(text);

    if (!value) return null;

    if (NO.test(value)) return "no";

    if (YES.test(value)) return "yes";

    return null;

}

// ======================================================
// VOICE GENDER
//   «با صدای زن» / «ویس دخترونه بده» / «female voice»  → "female"
//   «با صدای مرد» / «ویس مردونه»                       → "male"
//   چیزی نگفت → null (همون صدای پیش‌فرض)
//   اگه هر دو رو گفت، آخرین چیزی که گفته حساب می‌شه
// ======================================================

const FEMALE_WORDS = "(?:زن|زنانه|زنونه|زنا|زنها|خانم|خانوم|خانما|دختر|دخترانه|دخترونه|دخترا|مونث|female|woman|girl)";

const MALE_WORDS = "(?:مرد|مردانه|مردونه|مردا|آقا|آقایون|پسر|پسرانه|پسرونه|پسرا|مذکر|male|man|boy)";

function genderRegex(words) {

    return new RegExp(
        `(?:صدا(?:ی|ت)?|ویس(?:ی)?|voice)\\s*(?:یه\\s*|یک\\s*|ی\\s*)?(?:صدای\\s*)?(?<![\\p{L}])${words}(?![\\p{L}])` +
        `|(?<![\\p{L}])${words}\\s*(?:ویس|صدا|voice)`,
        "giu"
    );

}

const FEMALE_VOICE = genderRegex(FEMALE_WORDS);

const MALE_VOICE = genderRegex(MALE_WORDS);

function detectGender(text) {

    const value = prep(text);

    if (!value) return null;

    let femaleAt = -1;

    let maleAt = -1;

    for (const m of value.matchAll(FEMALE_VOICE)) femaleAt = m.index;

    for (const m of value.matchAll(MALE_VOICE)) maleAt = m.index;

    if (femaleAt < 0 && maleAt < 0) return null;

    return femaleAt > maleAt ? "female" : "male";

}

// آیا این آدم اجازه‌ی انتخاب نوع صدا رو داره؟ (پیش‌فرض: فقط مالک)
function genderAllowed(isOwner) {

    return VOICE.GENDER_FOR_ALL || Boolean(isOwner);

}

function voiceNameFor(gender) {

    if (gender === "female") return VOICE.VOICE_NAME_FEMALE;

    if (gender === "male") return VOICE.VOICE_NAME_MALE;

    return VOICE.VOICE_NAME;

}

// ======================================================
// TEXT HELPERS
// ======================================================

const EMOJI = /[\p{Extended_Pictographic}\uFE0F\u200d]/gu;

// متنی که واقعاً خونده می‌شه: بدون لینک، منشن، فرمت و ایموجی
function speakable(text) {

    return String(text || "")
        .replace(/https?:\/\/\S+/gi, " ")
        .replace(/@[A-Za-z0-9_]{3,}/g, " ")
        .replace(/[`*_#~>|]/g, " ")
        .replace(EMOJI, " ")
        .replace(/\s+/g, " ")
        .trim();

}

// متنی که به درد ویس نمی‌خوره: کد، لینک، خیلی بلند، یا بیشترش لاتین
function isVoiceFriendly(text, max) {

    const raw = String(text || "");

    if (/```|https?:\/\/|www\./i.test(raw)) return false;

    const clean = speakable(raw);

    if (clean.length < 2 || clean.length > max) return false;

    const latin = (clean.match(/[A-Za-z]/g) || []).length;

    return latin / clean.length <= 0.4;

}

// ======================================================
// SPONTANEOUS GATE (ویسِ خودخواسته)
// ======================================================

function spontaneousOffer(state) {

    if (!isEnabled() || !VOICE.SPONTANEOUS) return false;

    if (Date.now() - Number(state.lastVoiceAt || 0) < VOICE.SPONTANEOUS_GAP_MS) return false;

    return Math.random() < VOICE.OFFER_CHANCE;

}

// ======================================================
// AUDIO
// ======================================================

// صدای خام (16-bit مونو) → OGG/Opus
function pcmToOgg(pcm, rate) {

    return new Promise((resolve, reject) => {

        const ff = spawn(FFMPEG, [
            "-hide_banner", "-loglevel", "error",
            "-f", "s16le", "-ar", String(rate), "-ac", "1", "-i", "pipe:0",
            "-c:a", "libopus", "-b:a", "32k", "-application", "voip",
            "-f", "ogg", "pipe:1"
        ]);

        const out = [];

        let err = "";

        ff.stdout.on("data", chunk => out.push(chunk));

        ff.stderr.on("data", chunk => { err += chunk; });

        ff.on("error", error => reject(new Error("ffmpeg: " + error.message)));

        ff.on("close", code => {

            if (code === 0 && out.length) return resolve(Buffer.concat(out));

            reject(new Error("ffmpeg exit " + code + " " + err.slice(0, 200)));

        });

        // اگه ffmpeg زودتر بسته بشه، خطاش از close می‌رسه
        ff.stdin.on("error", () => { });

        ff.stdin.end(pcm);

    });

}

// متن → { ogg, seconds } یا null
// options.gender: "female" | "male" | null
async function synthesize(text, options = {}) {

    const spoken = speakable(text);

    if (!spoken) return null;

    if (typeof askGeminiSpeech !== "function") {
        throw new Error("askGeminiSpeech توی ai/gemini.js export نشده");
    }

    const audio = await askGeminiSpeech(`${VOICE.STYLE}: ${spoken}`, {
        voiceName: voiceNameFor(options.gender),
        languageCode: VOICE.LANGUAGE
    });

    if (!audio) return null;

    return {
        ogg: await pcmToOgg(audio.pcm, audio.rate),
        seconds: Math.max(1, Math.round(audio.pcm.length / 2 / audio.rate))
    };

}

// ======================================================
// TELEGRAM sendVoice (multipart)
// ======================================================

async function sendVoice(token, chatId, audio, options = {}) {

    const form = new FormData();

    form.append("chat_id", String(chatId));

    form.append("voice", new Blob([audio.ogg], { type: "audio/ogg" }), "voice.ogg");

    form.append("duration", String(audio.seconds));

    if (options.replyTo) {
        form.append("reply_to_message_id", String(options.replyTo));
        form.append("allow_sending_without_reply", "true");
    }

    if (options.threadId) form.append("message_thread_id", String(options.threadId));

    const response = await fetch(
        `https://api.telegram.org/bot${token}/sendVoice`,
        { method: "POST", body: form }
    );

    const data = await response.json();

    if (!data.ok) throw new Error(`sendVoice: ${data.description}`);

    return data.result;

}

// ======================================================
// DIAGNOSE (موقع استارت چک می‌کنه ویس اصلاً می‌تونه کار کنه)
// ======================================================

function runCommand(cmd, args) {

    return new Promise(resolve => {

        let out = "";

        let finished = false;

        const done = result => {
            if (finished) return;
            finished = true;
            resolve(result);
        };

        let child;

        try {
            child = spawn(cmd, args);
        }
        catch (error) {
            return done({ ok: false, out: error.message });
        }

        const timer = setTimeout(() => {
            try { child.kill(); } catch (e) { /* مهم نیست */ }
            done({ ok: false, out: "timeout" });
        }, 8000);

        child.stdout.on("data", chunk => { out += chunk; });

        child.stderr.on("data", chunk => { out += chunk; });

        child.on("error", error => {
            clearTimeout(timer);
            done({ ok: false, out: error.message });
        });

        child.on("close", code => {
            clearTimeout(timer);
            done({ ok: code === 0, out });
        });

    });

}

async function diagnose() {

    try {

        if (!VOICE.ENABLED) {
            console.log("🎙 VOICE CHECK: خاموشه (VOICE_ENABLED=0)");
            return false;
        }

        const problems = [];

        if (!process.env.GEMINI_API_KEY) {
            problems.push("GEMINI_API_KEY توی .env نیست");
        }

        if (typeof askGeminiSpeech !== "function") {
            problems.push("askGeminiSpeech توی ai/gemini.js export نشده (تابع ساخت صدا وجود نداره)");
        }

        const ff = await runCommand(FFMPEG, ["-hide_banner", "-encoders"]);

        if (!ff.ok) {
            problems.push(`ffmpeg اجرا نمی‌شه (${String(ff.out).slice(0, 80)}) → روی سرور نصبش کن یا npm i ffmpeg-static`);
        }
        else if (!/libopus/.test(ff.out)) {
            problems.push("ffmpeg نصبه ولی libopus نداره؛ نسخه‌ی کامل‌تر یا ffmpeg-static بذار");
        }

        if (problems.length) {

            console.log("❌ VOICE CHECK: ویس کار نمی‌کنه، چون:\n  - " + problems.join("\n  - "));

            return false;

        }

        console.log("✅ VOICE CHECK: همه‌چیز آماده‌ست (کلید، تابع صدا، ffmpeg + libopus)");

        return true;

    }
    catch (error) {

        console.log("❌ VOICE CHECK ERROR:", error.message);

        return false;

    }

}

// ======================================================
// HIGH LEVEL
// متن → ویس → ارسال. هر جا خراب شد null برمی‌گردونه
// (و bot.js همون جواب رو متنی می‌فرسته)
// ======================================================

async function speak(token, chatId, text, options = {}) {

    try {

        const max = options.requested
            ? VOICE.MAX_CHARS_REQUESTED
            : VOICE.MAX_CHARS_SPONTANEOUS;

        if (!isVoiceFriendly(text, max)) {

            console.log("🎙 VOICE SKIP: متن به درد ویس نمی‌خوره (بلند، لینک، یا بیشترش لاتین):", String(text).length, "کاراکتر");

            return null;

        }

        const audio = await synthesize(text, { gender: options.gender });

        if (!audio) {

            console.log("🎙 VOICE SKIP: مدل صدا هیچ صدایی برنگردوند");

            return null;

        }

        return await sendVoice(token, chatId, audio, options);

    }
    catch (error) {

        console.log("❌ VOICE ERROR:", error.message);

        return null;

    }

}

module.exports = {

    isEnabled,

    diagnose,

    detectRequest,

    detectGender,

    genderAllowed,

    voiceNameFor,

    spontaneousOffer,

    speak,

    // برای تست
    speakable,

    isVoiceFriendly,

    synthesize

};