// ======================================================
// ROBO QUIET — حالت «نظاره‌گر»
//
// وقتی کسی توی گروه به روبو بگه «فعلاً وارد بحث نشو / ساکت باش / چیزی نگو»،
// روبو توی همون گروه کاملاً ساکت می‌شه و فقط پیام‌ها رو می‌خونه (حافظه و
// پروفایل اعضا مثل قبل به‌روز می‌شه، ولی هیچ جواب، ریکشن، استیکر، ویس،
// خوش‌آمد یا شروع بحثی نمی‌فرسته).
//
// برگشتنش: «روبو بیا / حرف بزن / وارد بحث شو / ساکت نباش».
//
// فقط تشخیص دستور و نگه‌داشتنِ وضعیتِ هر گروه اینجاست؛
// ذخیره‌ی دائمی (که بعد از ری‌استارت هم بمونه) توی roboMemoryService انجام می‌شه.
// ======================================================

const QUIET = {

    // بعد از این‌قدر خودش برمی‌گرده؛ null = تا وقتی کسی صداش نکرده ساکت می‌مونه
    // (مثلاً ۳ ساعت: 3 * 60 * 60 * 1000)
    AUTO_RESUME_MS: null,

    // true = حتی وقتی ساکته، اگه مستقیم صداش بزنن (اسمش یا ریپلای) جواب می‌ده
    // false = فقط به دستور «برگرد» جواب می‌ده
    ANSWER_DIRECT_CALLS: false

};

// ======================================================
// تشخیص دستور
// ======================================================

// همون یکدست‌سازیِ bot.js (ی/ک عربی، اعراب، نیم‌فاصله، علامت‌ها)
function norm(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[\u064B-\u065F\u0640]/g, "")
        .replace(/\u200c/g, " ")
        .replace(/[^\p{L}\p{N}@_\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

}

const OBSERVE = new RegExp(
    [
        // «وارد بحث نشو»، «دخالت نکن»، «قاطی نشو»
        "(?:وارد|قاطی|دخالت|پا)\\s?(?:بحث|گفتگو|صحبت|چت|ما|اینجا)?\\s?(?:نشو|نشی|نشین|نکن|نکنی|نکنید)",
        // «ساکت باش / ساکت شو / ساکت بمون / ساکت باشی»
        "ساکت\\s?(?:باش|شو|بشین|بمون|بمونی|بشی)",
        // فقط وقتی کل پیام همین باشه («روبو ساکت»)؛ «چرا ساکتی» رو نمی‌گیره
        "^(?:فعلا\\s)?ساکت$",
        "سکوت\\s?(?:کن|کنی|اختیار)",
        "حرف\\s?(?:نزن|نزنی)",
        "چیزی\\s?نگو",
        "(?:هیچی|هیچ\\s?چی)\\s?نگو",
        "نظاره\\s?گر",
        "فقط\\s?(?:نگاه|ببین|تماشا|بخون|گوش)\\s?(?:کن|کنی|باش)",
        "خفه\\s?(?:شو|باش)"
    ].join("|"),
    "u"
);

const RESUME = new RegExp(
    [
        "ساکت\\s?نباش",
        "حرف\\s?بز(?:ن|نی)",
        "(?:وارد|قاطی)\\s?(?:بحث\\s|گفتگو\\s|صحبت\\s)?(?:شو|بشو|بشی|بشین)",
        "بیا(?:ین)?",
        "برگرد",
        "برگشتی",
        "آزاد(?:ی|\\s?شدی)",
        "دیگه\\s?ساکت",
        "می\\s?تونی\\s?حرف\\s?بز"
    ].join("|"),
    "u"
);

// text = متن پیام بعد از برداشتن اسمِ روبو
// برمی‌گردونه "observe" | "resume" | null
function detectCommand(text) {

    const value = norm(text);

    if (!value || value.length > 80) return null;

    // اول «ساکت شو»، بعد «برگرد»؛ تا «ساکت نباش» و «وارد بحث نشو» اشتباه برعکس نشن
    if (RESUME.test(value) && /ساکت\s?نباش|دیگه\s?ساکت/.test(value)) return "resume";

    if (OBSERVE.test(value)) return "observe";

    if (RESUME.test(value)) return "resume";

    return null;

}

// ======================================================
// وضعیت هر گروه
// ======================================================

const observing = new Map();

function load(chatIds) {

    for (const id of chatIds || []) {

        observing.set(String(id), { since: Date.now(), by: null });

    }

}

function isObserving(chatId) {

    const entry = observing.get(String(chatId));

    if (!entry) return false;

    if (QUIET.AUTO_RESUME_MS && Date.now() - entry.since > QUIET.AUTO_RESUME_MS) {

        observing.delete(String(chatId));

        return false;

    }

    return true;

}

function start(chatId, byUserId) {

    observing.set(String(chatId), { since: Date.now(), by: byUserId || null });

}

function stop(chatId) {

    observing.delete(String(chatId));

}

module.exports = {

    QUIET,

    detectCommand,

    isObserving,

    start,

    stop,

    load,

    // برای تست
    norm

};