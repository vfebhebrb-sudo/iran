// ======================================================
// ROBO QUIET — حالت «نظاره‌گر» (ساکت شدن و برگشتن)
//
//  «روبو فعلاً ساکت باش / وارد بحث نشو / چیزی نگو»  → فقط می‌خونه
//  «روبو بیا / برگرد / حرف بزن / ساکت نباش»          → دوباره حرف می‌زنه
//
// bot.js از این فایل اینا رو صدا می‌زنه:
//   detectCommand(text)  → "observe" | "resume" | null
//   isObserving(chatId)  → true/false
//   start(chatId, userId) / stop(chatId) / load(chatIds)
//   QUIET.ANSWER_DIRECT_CALLS
//
// وضعیتِ «ساکت» توی دیتابیس هم ذخیره می‌شه (setGroupObserving توی bot.js)،
// پس بعد از ری‌استارت هم می‌مونه. این فایل به دیتابیس وصل نمی‌شه؛
// فقط وقتی ساکت‌بودن تموم بشه (برگشت خودکار) یه بار سرویس رو صدا می‌زنه.
// ======================================================

const QUIET = {

    // false = وقتی ساکته حتی اگه صداش بزنن جواب نمی‌ده، فقط «روبو بیا» بیدارش می‌کنه
    // true  = خودش وارد بحث نمی‌شه ولی اگه مستقیم صداش بزنن جواب می‌ده
    ANSWER_DIRECT_CALLS: false,

    // بعد از این‌همه ساعت خودش برمی‌گرده تا یادش نره و برای همیشه ساکت نمونه
    // (۰ = برگشت خودکار نداشته باش)
    AUTO_RESUME_HOURS: 6,

    // دستور باید کوتاه باشه؛ وسط یه پیام بلند اتفاقی ساکتش نکنه
    MAX_OBSERVE_LEN: 70,
    MAX_RESUME_LEN: 60

};

// ======================================================
// STATE
// ======================================================

// chatId → { since: ms, by: userId|null }
const observing = new Map();

function key(chatId) {
    return String(chatId);
}

function start(chatId, userId) {

    observing.set(key(chatId), {
        since: Date.now(),
        by: userId ? String(userId) : null
    });

}

function stop(chatId) {

    observing.delete(key(chatId));

}

// بعد از ری‌استارت: گروه‌هایی که توی دیتابیس «ساکت» بودن
function load(chatIds) {

    for (const id of chatIds || []) {

        if (!observing.has(key(id))) {
            observing.set(key(id), { since: Date.now(), by: null });
        }

    }

}

function autoResume(chatId) {

    stop(chatId);

    console.log("🔊 OBSERVE AUTO-RESUME:", chatId);

    // وضعیت دیتابیس هم صاف بشه (اگه سرویس در دسترس نبود مهم نیست)
    try {

        const service = require("../services/roboMemoryService");

        if (service && typeof service.setGroupObserving === "function") {
            service.setGroupObserving(chatId, false).catch(() => { });
        }

    }
    catch (error) { /* مهم نیست */ }

}

function isObserving(chatId) {

    const entry = observing.get(key(chatId));

    if (!entry) return false;

    const hours = Number(QUIET.AUTO_RESUME_HOURS) || 0;

    if (hours > 0 && Date.now() - entry.since > hours * 3600 * 1000) {
        autoResume(chatId);
        return false;
    }

    return true;

}

// ======================================================
// COMMAND DETECTION
// ورودی همون متنیه که اسم روبو ازش برداشته شده (cleanMessage)
// ======================================================

function normalize(text) {

    return String(text || "")
        .replace(/[\u064B-\u065F\u0670\u0640]/g, "")   // اعراب و کشیده
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/ۀ/g, "ه")
        .replace(/[\u200c\u200f\u200e]/g, " ")          // نیم‌فاصله
        .replace(/\s+/g, " ")
        .toLowerCase()
        .trim();

}

// مرز کلمه‌ی فارسی/انگلیسی
const B = "(?<![\\p{L}\\d])";
const E = "(?![\\p{L}\\d])";

function rx(source) {
    return new RegExp(source, "u");
}

// «ساکت نباش» و «حرف بزن» باید قبل از «ساکت باش» و «حرف نزن» بررسی بشن
const RESUME = [

    rx(`${B}ساکت\\s*(?:نباش|نشو|نمون|نشین|نباشی)${E}`),
    rx(`${B}دیگه\\s*ساکت${E}`),
    rx(`${B}(?:حرف|صحبت|چت)\\s*(?:بزن|کن|بزنی|کنی)${E}`),
    rx(`${B}(?:بیا|بیاین|بیاید)${E}`),
    rx(`${B}(?:برگرد|برگرده|برگشتی|برگشت)${E}`),
    rx(`${B}بیدار\\s*شو${E}`),
    rx(`${B}(?:بیا\\s*)?تو\\s*(?:بحث|جمع|گپ)\\s*(?:بیا|باش)${E}`),
    rx(`${B}وارد\\s*بحث\\s*شو${E}`),
    rx(`${B}نظاره\\s*گر\\s*(?:نباش|نشو)${E}`),
    rx(`${B}(?:آزادی|ازادی)${E}`),
    rx(`${B}(?:می\\s*تونی|میتونی)\\s*(?:حرف|صحبت)\\s*بزنی${E}`)

];

const OBSERVE = [

    rx(`${B}ساکت\\s*(?:شو|باش|بشو|بمون|بشین|باشی|بشی)${E}`),
    rx(`${B}(?:حرف|صحبت|چت)\\s*(?:نزن|نکن|نزنی|نکنی)${E}`),
    rx(`${B}(?:هیچی|چیزی|هیچ\\s*چی|چیز)\\s*(?:نگو|نگی|ننویس)${E}`),
    rx(`${B}(?:وارد|تو|توی)\\s*بحث\\s*(?:نشو|نیا|نیای|نباش)${E}`),
    rx(`${B}(?:دخالت|فضولی|پارازیت)\\s*نکن${E}`),
    rx(`${B}فقط\\s*(?:بخون|نگاه\\s*کن|ببین|تماشا\\s*کن)${E}`),
    rx(`${B}نظاره\\s*گر\\s*(?:شو|باش)${E}`),
    rx(`${B}(?:فعلا|فعلاً)\\s*(?:نگو|بسه|ساکت)${E}`),
    rx(`${B}(?:صدات|صدات\\s*رو)\\s*نبینم${E}`)

];

// «روبو بهش بگو ساکت شو» یعنی خطاب به یه نفر دیگه‌ست، نه خود روبو
const ABOUT_SOMEONE_ELSE = rx(`${B}(?:بهش|بهشون|بهشو|براش|واسش|بگو|بگین|بنویس)${E}`);

function detectCommand(text) {

    const value = normalize(text);

    if (!value) return null;

    // برگشتن: زود و ساده‌تر پذیرفته می‌شه (فقط وقتی ساکته استفاده می‌شه)
    if (value.length <= QUIET.MAX_RESUME_LEN && RESUME.some(re => re.test(value))) {
        return "resume";
    }

    if (value.length > QUIET.MAX_OBSERVE_LEN) return null;

    // سوال («می‌تونی ساکت بشی؟») دستور نیست
    if (/[?؟]/.test(value)) return null;

    if (ABOUT_SOMEONE_ELSE.test(value)) return null;

    if (OBSERVE.some(re => re.test(value))) return "observe";

    return null;

}

module.exports = {

    QUIET,

    detectCommand,

    isObserving,

    start,

    stop,

    load,

    // برای تست
    normalize

};