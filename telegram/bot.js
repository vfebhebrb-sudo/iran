// ======================================================
// TELEGRAM SMART ROBO BOT
// v4: استیکر و گیف، شناخت اعضا، مشارکت متعادل‌تر
// ======================================================

const TelegramBot = require("node-telegram-bot-api");

const fs = require("fs");

const path = require("path");

const {
    saveMemory,
    getMemory,
    getUserName,
    saveGroupMessage,
    getRecentGroupMessages,
    touchMember,
    getProfiles,
    getRoster,
    countKnownMembers,
    setMemberFlags,
    forgetMember
} = require("../services/roboMemoryService");

const { getSiteContext } = require("../services/siteBrainService");

const { isBinaryMessage, isPromptInjection } = require("./guards");

const { think, normalizeEmoji, ALLOWED_REACTIONS } = require("./roboBrain");

const media = require("./roboMedia");

const profiler = require("./roboProfiler");

console.log("🔥 TELEGRAM ROBO BOT LOADED");

const TOKEN = process.env.TELEGRAM_TOKEN;

let bot = null;

let botInfo = { id: null, username: "" };

const FILE_DIR = path.join(__dirname, "../temp-files");

// ======================================================
// CONFIG — رفتار انسانی روبو اینجا تنظیم می‌شه
// ======================================================

const CONFIG = {

    // چند پیام آخر گروه به مدل داده بشه
    CONTEXT_MESSAGES: 30,

    // بعد از آخرین پیام گروه، چند میلی‌ثانیه صبر کنه تا ببینه بحث تموم شد
    DEBOUNCE_MS: 3500,

    // حداکثر انتظار (وسط گفتگوی شلوغ هم گاهی فرصت دخالت پیدا کنه)
    MAX_WAIT_MS: 18000,

    // احتمال پایه‌ی اینکه اصلاً به یه پیام بی‌خطاب فکر کنه (۰ تا ۱)
    // (بالاتر = فعال‌تر؛ تعادل رو SHARE پایین حفظ می‌کنه)
    BASE_CHANCE: 0.45,

    // حداقل فاصله بین دو دخالت خودخواسته‌ی روبو
    COOLDOWN_MS: 45 * 1000,

    // حداکثر دخالت خودخواسته در ساعت برای هر گروه
    MAX_PROACTIVE_PER_HOUR: 14,

    // تعادل: از N پیام آخر، سهم روبو بیشتر از این نباشه (۰.۲۲ = حدود یک‌پنجم)
    SHARE_WINDOW: 20,
    MAX_BOT_SHARE: 0.22,

    // حداقل فاصله بین دو استیکر/گیف
    MEDIA_GAP_DIRECT_MS: 30 * 1000,
    MEDIA_GAP_PROACTIVE_MS: 3 * 60 * 1000,

    // پیام‌های قدیمی‌تر از این (ثانیه) رو بعد از ری‌استارت جواب نده
    STALE_SECONDS: 120,

    // ساعت‌هایی که فقط وقتی صداش بزنن جواب می‌ده (مثل آدمی که خوابه)
    // برای خاموش کردن: QUIET_HOURS: null
    QUIET_HOURS: { start: 2, end: 8 },

    TIMEZONE: "Asia/Tehran",

    // چند نفر از اعضای بحث (و پروفایلشون) به مدل داده بشه
    PEOPLE_MAX: 8,

    // کش لیست اعضا
    ROSTER_CACHE_MS: 2 * 60 * 1000,

    // هر چند وقت یه بار لیست ادمین‌ها و تعداد اعضای گروه از تلگرام گرفته بشه
    PRIME_EVERY_MS: 6 * 60 * 60 * 1000

};

// ======================================================
// SMALL HELPERS
// ======================================================

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const rand = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

const pick = list => list[Math.floor(Math.random() * list.length)];

const SITE_WORDS = /سایت|فایل|درس|جزوه|ریزئو|riseo|pdf|دانلود|نمونه\s?سوال|امتحان|کتاب/i;

// حرف زدن درباره‌ی ربات و هوش مصنوعی (روبو دوست داره وارد این بحث‌ها بشه)
const BOT_TALK = /(?<![\p{L}])(?:ربات|روبات|بات|هوش\s?مصنوعی|chatgpt|gpt|gemini|جمینای)(?![\p{L}])/iu;

const FORGET_LINES = [
    "باشه، هر چی از تو یادم بود پاک شد. از اول با هم آشنا می‌شیم 😄",
    "پاک شد. دفتر خاطراتم از تو سفید سفیده، حالا یه شروع تازه 😎"
];

const EMPTY_CALL_LINES = [
    "بله؟ گوشم با توئه 👋",
    "جانم؟ بگو",
    "هوم؟ بنال ببینم",
    "بفرما، چی شده؟"
];

const BLOCK_LINES = [
    "نه جوجه، گول نمی‌خورم 😂",
    "این ترفندا برا من قدیمیه، یه چیز جدید بیار 😎",
    "فکر کردی با دو تا صفر و یک خر می‌شم؟ 😂",
    "هکر شدی؟ برو یه چایی بخور بابا"
];

const FAIL_LINES = [
    "مغزم یه لحظه هنگ کرد، دوباره بگو",
    "سرور داره نفس‌نفس می‌زنه، یه دقیقه دیگه بپرس 😅"
];

// ======================================================
// FILE SYSTEM
// ======================================================

function getFiles() {

    if (!fs.existsSync(FILE_DIR)) {
        return [];
    }

    return fs
        .readdirSync(FILE_DIR)
        .filter(x => !x.startsWith("."));

}

// ======================================================
// NAME / TRIGGER DETECTION
// ======================================================

// «روبو» یا «robo» به‌صورت کلمه‌ی مستقل؛ «روبوت» و «robot» نمی‌خورن
const NAME_SOURCE = "(?<![\\p{L}\\d])(?:روبو|robo)(?![\\p{L}\\d])";

const NAME_TEST = new RegExp(NAME_SOURCE, "iu");

const NAME_GLOBAL = new RegExp(NAME_SOURCE, "giu");

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTrigger(msg, text) {

    if (msg.chat.type === "private") return "private";

    if (
        botInfo.username &&
        text.toLowerCase().includes("@" + botInfo.username.toLowerCase())
    ) {
        return "mention";
    }

    if (NAME_TEST.test(text)) return "name";

    if (
        botInfo.id &&
        msg.reply_to_message &&
        msg.reply_to_message.from &&
        msg.reply_to_message.from.id === botInfo.id
    ) {
        return "reply_to_bot";
    }

    return "none";

}

function cleanMessage(text) {

    let result = text.replace(NAME_GLOBAL, "");

    if (botInfo.username) {

        result = result.replace(
            new RegExp("@" + escapeRegExp(botInfo.username), "gi"),
            ""
        );

    }

    return result
        .replace(/^[\s,،:؛.!؟?\-]+/, "")
        .trim();

}

// ======================================================
// EXTRACT USER NAME
// (قبلاً «اسم من چیه؟» رو هم به‌عنوان اسم ذخیره می‌کرد)
// ======================================================

function extractName(text) {

    const patterns = [
        /اسمم\s+(.+?)\s+(?:هست|است)\s*$/,
        /اسم\s+من\s+(.+?)\s+(?:هست|است)\s*$/,
        /منو\s+(.+?)\s+صدا\s*(?:کن|بزن)/,
        /اسمم\s+(.+)$/,
        /اسم\s+من\s+(.+)$/
    ];

    const bad = /[?؟!]|چی|کیه|یادت|میدونی|می‌دونی|می\sدونی|هست|نیست|بود|چنده/;

    for (const regex of patterns) {

        const match = text.match(regex);

        if (!match) continue;

        const name = match[1].trim();

        if (name.length < 2 || name.length > 20) continue;

        if (name.split(/\s+/).length > 3) continue;

        if (bad.test(name)) continue;

        return name;

    }

    return null;

}

// کش اسم کاربرها تا برای هر پیام گروه به دیتابیس نخوریم

const nameCache = new Map();

async function resolveName(chatId, userId, from) {

    const key = chatId + ":" + userId;

    const hit = nameCache.get(key);

    if (hit && Date.now() - hit.at < 10 * 60 * 1000) {
        return hit.name;
    }

    let name = null;

    try {
        name = await getUserName(chatId, userId);
    }
    catch (e) { /* مهم نیست */ }

    name = name || (from && (from.first_name || from.username)) || "کاربر";

    nameCache.set(key, { name, at: Date.now() });

    return name;

}

// ======================================================
// TELEGRAM ACTIONS
// ======================================================

async function sendOut(chatId, text, options = {}) {

    const params = {};

    if (options.replyTo) {
        params.reply_to_message_id = options.replyTo;
        params.allow_sending_without_reply = true;
    }

    if (options.threadId) {
        params.message_thread_id = options.threadId;
    }

    return bot.sendMessage(chatId, String(text).slice(0, 4000), params);

}

// قدیمی‌ترین تابع send برای دستورهای فایل
async function send(chat, text) {

    try {

        const result = await bot.sendMessage(chat, text);

        console.log("✅ SENT:", result.message_id);

    }
    catch (error) {

        console.log("SEND ERROR:", error.message);

    }

}

// صدا زدن مستقیم API تلگرام (به نسخه‌ی کتابخونه وابسته نیست؛ نیاز به Node 18+)
async function tg(method, body) {

    const response = await fetch(
        `https://api.telegram.org/bot${TOKEN}/${method}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body || {})
        }
    );

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`${method}: ${data.description}`);
    }

    return data.result;

}

async function setReaction(chatId, messageId, emoji) {

    const normalized = normalizeEmoji(emoji);

    if (!normalized || !ALLOWED_REACTIONS.has(normalized)) return;

    try {

        await tg("setMessageReaction", {
            chat_id: chatId,
            message_id: messageId,
            reaction: [{ type: "emoji", emoji: normalized }]
        });

        console.log("👍 REACTED:", normalized, "→", messageId);

    }
    catch (error) {

        console.log("REACTION ERROR:", error.message);

    }

}

function startTyping(chatId, threadId, action = "typing") {

    let active = true;

    const tick = () => {

        if (!active) return;

        bot
            .sendChatAction(
                chatId,
                action,
                threadId ? { message_thread_id: threadId } : {}
            )
            .catch(() => { });

    };

    tick();

    const timer = setInterval(tick, 4000);

    return () => {
        active = false;
        clearInterval(timer);
    };

}

// مکث قبل از ارسال: آدم‌ها تایپ می‌کنن، فوری جواب نمی‌دن
async function humanWait(chatId, threadId, length, direct) {

    const ms = direct
        ? rand(300, 900) + Math.min(length * 15, 2500)
        : rand(1200, 2500) + Math.min(length * 30, 5000);

    const stop = startTyping(chatId, threadId);

    await sleep(ms);

    stop();

}

// مکث کوتاه قبل از استیکر/گیف (آدم‌ها «استیکر انتخاب می‌کنن»)
async function stickerWait(chatId, threadId) {

    const stop = startTyping(chatId, threadId, "choose_sticker");

    await sleep(rand(900, 2200));

    stop();

}

// ساعت فعلی به وقت تهران + حال‌وهوای روز (برای خودِ مدل هم می‌ره)
function nowInfo() {

    const parts = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: CONFIG.TIMEZONE
    }).formatToParts(new Date());

    const hour = Number(parts.find(p => p.type === "hour").value);

    const minute = parts.find(p => p.type === "minute").value;

    const label = hour < 5
        ? "نیمه‌شب"
        : hour < 11
            ? "صبح"
            : hour < 14
                ? "ظهر"
                : hour < 17
                    ? "بعدازظهر"
                    : hour < 20
                        ? "عصر"
                        : "شب";

    return {
        hour,
        text: `ساعت ${String(hour).padStart(2, "0")}:${minute} (${label})`
    };

}

function isQuietHour() {

    const quiet = CONFIG.QUIET_HOURS;

    if (!quiet) return false;

    const hour = nowInfo().hour;

    return quiet.start < quiet.end
        ? hour >= quiet.start && hour < quiet.end
        : hour >= quiet.start || hour < quiet.end;

}

// ======================================================
// PER-CHAT STATE
// ======================================================

const chats = new Map();

function st(chatId) {

    if (!chats.has(chatId)) {

        chats.set(chatId, {
            timer: null,
            pendingSince: 0,
            busy: 0,
            chain: Promise.resolve(),
            lastBotAt: 0,
            lastProactiveAt: 0,
            proactiveTimes: [],
            lastInfo: null,
            lastMediaAt: 0,
            recentMedia: []
        });

    }

    return chats.get(chatId);

}

// کارهای هر چت پشت‌سرهم اجرا می‌شن تا جواب‌ها قاطی نشن
function enqueue(chatId, job) {

    const state = st(chatId);

    state.busy++;

    state.chain = state.chain
        .then(job)
        .catch(error => console.log("❌ ROBO JOB ERROR:", error.message))
        .finally(() => { state.busy--; });

    return state.chain;

}

// ======================================================
// GROUP META (ادمین‌ها و تعداد اعضا؛ تلگرام لیست کامل اعضا رو به ربات نمی‌ده،
// پس بقیه‌ی اعضا فقط وقتی شناخته می‌شن که توی گروه حرف بزنن یا وارد بشن)
// ======================================================

const chatMeta = new Map();

async function primeGroup(chat) {

    const chatId = String(chat.id);

    let meta = chatMeta.get(chatId);

    if (!meta) {

        meta = { admins: new Map(), memberCount: null, primedAt: 0, ready: false };

        chatMeta.set(chatId, meta);

    }

    if (Date.now() - meta.primedAt < CONFIG.PRIME_EVERY_MS) return meta;

    // اول زمان رو ثبت کن تا پیام‌های هم‌زمان یا خطا، حلقه نسازن
    meta.primedAt = Date.now();

    try {

        const admins = await tg("getChatAdministrators", { chat_id: chat.id });

        const next = new Map();

        for (const admin of admins) {

            if (!admin.user || admin.user.is_bot) continue;

            next.set(String(admin.user.id), admin.status);

            await touchMember({
                chatId,
                userId: String(admin.user.id),
                username: admin.user.username || null,
                name: admin.user.first_name || admin.user.username || "کاربر",
                role: admin.status,
                soft: true
            });

        }

        meta.admins = next;

        meta.ready = true;

    }
    catch (error) {

        console.log("PRIME ADMINS ERROR:", error.message);

    }

    try {

        meta.memberCount = await tg("getChatMemberCount", { chat_id: chat.id });

    }
    catch (error) { /* مهم نیست */ }

    return meta;

}

// ======================================================
// PEOPLE (پروفایل اعضا برای مدل)
// ======================================================

const rosterCache = new Map();

async function getRosterCached(chatId) {

    const hit = rosterCache.get(chatId);

    if (hit && Date.now() - hit.at < CONFIG.ROSTER_CACHE_MS) return hit;

    const [roster, known] = await Promise.all([
        getRoster(chatId, 40),
        countKnownMembers(chatId)
    ]);

    const entry = { at: Date.now(), roster, known };

    rosterCache.set(chatId, entry);

    return entry;

}

async function gatherPeople(chatId, info, recent) {

    const ids = [];

    for (let i = recent.length - 1; i >= 0 && ids.length < CONFIG.PEOPLE_MAX; i--) {

        const m = recent[i];

        if (m.isBot) continue;

        if (!ids.includes(String(m.userId))) ids.push(String(m.userId));

    }

    for (const extra of [info.userId, info.replyToUserId]) {

        if (extra && !ids.includes(String(extra))) ids.push(String(extra));

    }

    const [people, rosterEntry] = await Promise.all([
        getProfiles(chatId, ids),
        getRosterCached(chatId)
    ]);

    const meta = chatMeta.get(chatId);

    return {
        people,
        roster: rosterEntry.roster,
        known: rosterEntry.known,
        memberCount: meta ? meta.memberCount : null
    };

}

// ======================================================
// NOTES FOR THE MODEL (<situation>)
// ======================================================

function shareNoteFor(recent) {

    const tail = recent.slice(-CONFIG.SHARE_WINDOW);

    if (tail.length < 6) return "";

    const mine = tail.filter(m => m.isBot).length;

    return `از ${tail.length} پیام آخر گروه، ${mine} تاش مال خودته.`;

}

function mediaNoteFor(state) {

    if (!state.lastMediaAt) return "";

    const sec = Math.round((Date.now() - state.lastMediaAt) / 1000);

    if (sec > 30 * 60) return "";

    const ago = sec < 90 ? `${sec} ثانیه` : `${Math.round(sec / 60)} دقیقه`;

    return `آخرین استیکر یا گیفی که فرستادی حدود ${ago} پیش بوده.`;

}

function speakerNoteFor(info) {

    if (info.isNew) {
        return "(اولین باره از این آدم توی گروه پیام می‌بینی؛ شاید تازه‌وارده، شاید تا حالا ساکت بوده.)";
    }

    if (info.absentHours && info.absentHours >= 72) {
        return `(بعد از حدود ${Math.round(info.absentHours / 24)} روز غیبت برگشته.)`;
    }

    return "";

}

function groupNoteFor(social) {

    if (!social.memberCount) return "";

    return `گروه حدود ${social.memberCount} عضو داره؛ تو فقط ${social.known} نفرشون رو می‌شناسی (کسایی که تا حالا توی گروه حرف زدن).`;

}

// ======================================================
// BALANCE (متعادل بودن سهم روبو)
// ======================================================

function balanceAllows(recent) {

    // توی ۳ پیام آخر دوتاش از خودش بوده: بذار بقیه حرف بزنن
    if (recent.slice(-3).filter(m => m.isBot).length >= 2) return false;

    const tail = recent.slice(-CONFIG.SHARE_WINDOW);

    if (tail.length >= 8) {

        const share = tail.filter(m => m.isBot).length / tail.length;

        if (share > CONFIG.MAX_BOT_SHARE) return false;

    }

    return true;

}

// ======================================================
// PROACTIVE (دخالت خودخواسته مثل آدم)
// ======================================================

function interestChance(info, state) {

    const value = String(info.text || "").trim();

    // تازه‌وارد: تقریباً همیشه ارزش یه خوش‌آمد رو داره
    if (info.kind === "join") return 0.9;

    let chance = CONFIG.BASE_CHANCE;

    if (/[?؟]/.test(value)) chance += 0.25;

    if (value.length < 4) chance -= 0.2;

    if (value.length > 60) chance += 0.1;

    if (SITE_WORDS.test(value)) chance += 0.2;

    if (BOT_TALK.test(value)) chance += 0.25;

    if (/[😂🤣😹]/u.test(value)) chance += 0.1;

    if (info.kind === "sticker" || info.kind === "gif") chance += 0.1;

    // خیلی وقته چیزی نگفته: یه ذره بیشتر تمایل داره
    const quietMin = state.lastBotAt
        ? (Date.now() - state.lastBotAt) / 60000
        : 999;

    if (quietMin > 10) chance += 0.1;

    return Math.max(0.05, Math.min(0.85, chance));

}

function scheduleProactive(chatId, info) {

    const state = st(chatId);

    state.lastInfo = info;

    const now = Date.now();

    if (state.timer) {

        // وسط بحث شلوغ هم بذار گاهی تایمر برسه
        if (now - state.pendingSince < CONFIG.MAX_WAIT_MS) {
            clearTimeout(state.timer);
        }
        else {
            return;
        }

    }
    else {
        state.pendingSince = now;
    }

    state.timer = setTimeout(
        () => {
            evaluateProactive(chatId)
                .catch(error => console.log("❌ PROACTIVE ERROR:", error.message));
        },
        CONFIG.DEBOUNCE_MS + rand(0, 2500)
    );

}

async function evaluateProactive(chatId) {

    const state = st(chatId);

    state.timer = null;
    state.pendingSince = 0;

    const info = state.lastInfo;

    if (!info) return;

    if (state.busy > 0) return;

    if (isQuietHour()) return;

    const now = Date.now();

    // تازه حرف زده؛ فوراً دوباره نیاد
    if (now - state.lastBotAt < 20 * 1000) return;

    if (now - state.lastProactiveAt < CONFIG.COOLDOWN_MS) return;

    state.proactiveTimes = state.proactiveTimes.filter(t => now - t < 60 * 60 * 1000);

    if (state.proactiveTimes.length >= CONFIG.MAX_PROACTIVE_PER_HOUR) return;

    if (Math.random() > interestChance(info, state)) return;

    enqueue(chatId, () =>
        respond({
            chatId,
            info,
            trigger: "none",
            cleanText: info.text,
            newName: null
        })
    );

}

// ======================================================
// MEDIA PICK (استیکر/گیف)
// ======================================================

async function pickMediaForSend(state, want, direct) {

    const gap = direct
        ? CONFIG.MEDIA_GAP_DIRECT_MS
        : CONFIG.MEDIA_GAP_PROACTIVE_MS;

    if (Date.now() - state.lastMediaAt < gap) return null;

    return media.pickForSend(want.kind, want.mood, state.recentMedia);

}

// ======================================================
// RESPOND — فکر کردن، تصمیم، ریکشن/ریپلای/استیکر
// ======================================================

async function respond(job) {

    const { chatId, info, trigger, cleanText, newName } = job;

    const state = st(chatId);

    const direct = trigger !== "none";

    const hard = direct && trigger !== "reply_to_bot";

    const isPrivate = info.chatType === "private";

    const stopTyping = hard
        ? startTyping(chatId, info.threadId)
        : () => { };

    let decision = null;

    try {

        const recent = await getRecentGroupMessages(
            chatId,
            CONFIG.CONTEXT_MESSAGES
        );

        // دخالت خودخواسته فقط وقتی سهم روبو از گروه متعادله
        if (!direct && !balanceAllows(recent)) return;

        const tail = recent
            .slice(-4)
            .map(m => m.text)
            .join(" ");

        const siteContext = SITE_WORDS.test(tail)
            ? await getSiteContext().catch(() => "")
            : "";

        const userMemory = direct
            ? await getMemory(chatId, info.userId)
            : [];

        const social = isPrivate
            ? { people: [], roster: [], known: 0, memberCount: null }
            : await gatherPeople(chatId, info, recent);

        const library = await media.getLibrarySummary();

        decision = await think({
            recent,
            trigger,
            event: info.kind === "join" ? "join" : null,
            chatType: info.chatType,
            chatTitle: info.title,
            speakerName: info.name,
            speakerId: info.userId,
            userMemory,
            siteContext,
            lastBotAgoSec: state.lastBotAt
                ? Math.round((Date.now() - state.lastBotAt) / 1000)
                : null,
            nowText: nowInfo().text,
            speakerNote: speakerNoteFor(info),
            shareNote: isPrivate ? "" : shareNoteFor(recent),
            mediaNote: mediaNoteFor(state),
            groupNote: isPrivate ? "" : groupNoteFor(social),
            people: social.people,
            roster: social.roster,
            library: library.text
        });

    }
    finally {

        stopTyping();

    }

    // مدل جواب نداد
    if (!decision) {

        if (hard) {

            await sendOut(chatId, pick(FAIL_LINES), {
                replyTo: isPrivate ? null : info.messageId,
                threadId: info.threadId
            });

        }

        return;

    }

    // متن ساده (غیر JSON) فقط وقتی صداش زدن قابل قبوله
    if (decision.fallbackPlain && !hard) return;

    let action = decision.action;

    let reaction = decision.reaction;

    // صداش زدن ولی مدل ignore گفت: حداقل یه ریکشن
    if (hard && action === "ignore") {

        action = "react";

        reaction = reaction || "👀";

    }

    if (action === "ignore") return;

    // ----- ریکشن -----

    const reactTarget = decision.replyTo || info.messageId;

    if ((action === "react" || action === "reply") && reaction) {

        await setReaction(chatId, reactTarget, reaction);

    }

    if (action === "react") {

        state.lastBotAt = Date.now();

        return;

    }

    // ----- استیکر / گیف -----

    const item = decision.media
        ? await pickMediaForSend(state, decision.media, direct)
        : null;

    // فقط استیکر می‌خواست ولی (فاصله‌ی مجاز نبود یا آیتم مناسب نبود): با ریکشن جمعش کن

    if (!decision.text && !item) {

        if (!reaction) {

            await setReaction(
                chatId,
                reactTarget,
                media.moodReaction(decision.media && decision.media.mood)
            );

        }

        state.lastBotAt = Date.now();

        return;

    }

    // ----- جواب -----

    let replyTo = null;

    if (!isPrivate) {

        replyTo = decision.replyTo || (direct ? info.messageId : null);

    }

    let sentAny = false;

    if (decision.text) {

        await humanWait(chatId, info.threadId, decision.text.length, direct);

        const sent = await sendOut(chatId, decision.text, {
            replyTo,
            threadId: info.threadId
        });

        console.log("✅ SENT:", sent.message_id);

        state.lastBotAt = Date.now();

        sentAny = true;

        // پیام خود روبو هم توی تاریخچه‌ی گروه ذخیره بشه

        await saveGroupMessage({
            chatId,
            messageId: sent.message_id,
            userId: String(botInfo.id || "bot"),
            username: botInfo.username,
            name: "روبو",
            text: decision.text,
            replyToMessageId: replyTo,
            isBot: true
        });

    }

    if (item) {

        if (decision.text) {
            await sleep(rand(700, 1800));
        }
        else {
            await stickerWait(chatId, info.threadId);
        }

        const sentMedia = await media.sendItem(
            { tg, adminId: process.env.TELEGRAM_ADMIN_ID },
            chatId,
            item,
            {
                replyTo: decision.text ? null : replyTo,
                threadId: info.threadId
            }
        );

        if (sentMedia) {

            console.log("🎞 MEDIA SENT:", item.kind, item.mood);

            sentAny = true;

            state.lastBotAt = Date.now();

            state.lastMediaAt = Date.now();

            state.recentMedia.push(item.fileUniqueId);

            if (state.recentMedia.length > 15) state.recentMedia.shift();

            await saveGroupMessage({
                chatId,
                messageId: sentMedia.message_id,
                userId: String(botInfo.id || "bot"),
                username: botInfo.username,
                name: "روبو",
                text: media.describeItem(item),
                replyToMessageId: decision.text ? null : replyTo,
                isBot: true
            });

        }

    }

    // هیچی ارسال نشد (مثلاً فایل استیکر خراب بود)
    if (!sentAny) {

        if (!reaction) {

            await setReaction(
                chatId,
                reactTarget,
                media.moodReaction(decision.media && decision.media.mood)
            );

        }

        return;

    }

    if (!direct) {

        state.lastProactiveAt = Date.now();

        state.proactiveTimes.push(Date.now());

    }

    // حافظه‌ی کاربر (مثل قبل) فقط وقتی مستقیم باهاش حرف زدن

    if (direct) {

        await saveMemory({
            chatId,
            userId: info.userId,
            username: info.username,
            name: newName || null,
            message: cleanText,
            answer: decision.text || (item ? media.describeItem(item) : "")
        });

    }

}

// ======================================================
// MESSAGE CONTENT
// متن، یا یه توصیف کوتاه برای استیکر/گیف/عکس/... تا توی تاریخچه‌ی گروه
// ببینمش (محتوای عکس و ویدیو و ویس دیده نمی‌شه، فقط وجودش)
// ======================================================

function extractContent(msg) {

    const plain = (msg.text || msg.caption || "").trim();

    let kind = "text";

    let label = "";

    if (msg.sticker) {

        kind = "sticker";

        label = `استیکر${msg.sticker.emoji ? " " + msg.sticker.emoji : ""}`;

    }
    else if (msg.animation || (msg.document && /image\/gif/i.test(msg.document.mime_type || ""))) {

        kind = "gif";

        label = "گیف";

    }
    else if (msg.photo) {

        kind = "photo";

        label = "عکس";

    }
    else if (msg.video) {

        kind = "video";

        label = "ویدیو";

    }
    else if (msg.video_note) {

        kind = "video_note";

        label = "ویدیو مسیج";

    }
    else if (msg.voice) {

        kind = "voice";

        label = "ویس";

    }
    else if (msg.audio) {

        kind = "audio";

        label = "آهنگ";

    }
    else if (msg.document) {

        kind = "document";

        const fileName = String(msg.document.file_name || "").slice(0, 40);

        label = fileName ? `فایل: ${fileName}` : "فایل";

    }
    else if (msg.poll) {

        kind = "poll";

        label = `نظرسنجی: ${String(msg.poll.question || "").slice(0, 60)}`;

    }

    const placeholder = label ? `[${label}]` : "";

    return {
        plain,
        kind,
        placeholder,
        full: `${placeholder} ${plain}`.trim()
    };

}

// ======================================================
// NEW MEMBERS
// ======================================================

async function onJoin(msg) {

    if (msg.chat.type === "private") return;

    const members = (msg.new_chat_members || []).filter(u => !u.is_bot);

    if (!members.length) return;

    const chatId = String(msg.chat.id);

    for (const user of members) {

        await touchMember({
            chatId,
            userId: String(user.id),
            username: user.username || null,
            name: user.first_name || user.username || "کاربر",
            soft: true
        });

    }

    const first = members[0];

    const name = first.first_name || first.username || "کاربر";

    const text = `[${name} تازه وارد گروه شد]`;

    await saveGroupMessage({
        chatId,
        messageId: msg.message_id,
        userId: String(first.id),
        username: first.username || null,
        name,
        text,
        replyToMessageId: null,
        isBot: false
    });

    if (Date.now() / 1000 - msg.date > CONFIG.STALE_SECONDS) return;

    if (isQuietHour()) return;

    scheduleProactive(chatId, {
        messageId: msg.message_id,
        userId: String(first.id),
        username: first.username || null,
        name,
        chatType: msg.chat.type,
        title: msg.chat.title || null,
        threadId: msg.is_topic_message ? msg.message_thread_id : undefined,
        text,
        kind: "join",
        replyToUserId: null,
        isNew: true,
        absentHours: null
    });

}

// ======================================================
// MESSAGE HANDLER
// ======================================================

async function onMessage(msg) {

    try {

        if (msg.new_chat_members) return await onJoin(msg);

        if (!msg.from || msg.from.is_bot) return;

        const content = extractContent(msg);

        if (!content.full) return;

        // دستورات اسلش (/start و ...) نادیده
        if (content.plain.startsWith("/")) return;

        const isPrivate = msg.chat.type === "private";

        // ==========================================
        // استیکر / پک / گیفی که کسی پیوی می‌فرسته:
        // برداشته می‌شه و بعداً توی گروه‌ها استفاده می‌شه
        // ==========================================

        if (isPrivate) {

            const handled = await media.handleIncoming(
                { tg, adminId: process.env.TELEGRAM_ADMIN_ID },
                msg
            );

            if (handled) return;

        }

        // ==========================================
        // دستورات فایل (مستقل از روبو)
        // ==========================================

        const text = content.plain;

        if (content.kind === "text" && text === "لیست فایل ها") {

            const files = getFiles();

            if (files.length === 0) {
                return send(msg.chat.id, "❌ فایلی وجود ندارد");
            }

            let result = "📁 فایل‌ها:\n\n";

            files.forEach((file, index) => {
                result += `${index + 1}️⃣ ${file}\n`;
            });

            return send(msg.chat.id, result);

        }

        // فقط وقتی کل پیام «دریافت N» باشه (نه هر جمله‌ای که این کلمه توش بود)
        const fileMatch = content.kind === "text"
            ? text.match(/^دریافت\s+(\d+)$/)
            : null;

        if (fileMatch) {

            const index = Number(fileMatch[1]) - 1;

            const file = getFiles()[index];

            if (!file) {
                return send(msg.chat.id, "❌ فایل پیدا نشد");
            }

            return bot.sendDocument(
                msg.chat.id,
                path.join(FILE_DIR, file)
            );

        }

        // ==========================================
        // آماده‌سازی
        // ==========================================

        const chatId = String(msg.chat.id);

        const userId = String(msg.from.id);

        const username = msg.from.username || null;

        const trigger = getTrigger(msg, text);

        const direct = trigger !== "none";

        const cleanedPlain = direct ? cleanMessage(text) : text;

        // متنی که مدل می‌بینه (برای استیکر/عکس: توصیفش + کپشن)
        const cleanText = direct
            ? `${content.placeholder} ${cleanedPlain}`.trim()
            : content.full;

        const suspicious = text
            ? (isBinaryMessage(text) || isPromptInjection(cleanedPlain))
            : false;

        const displayName = await resolveName(chatId, userId, msg.from);

        // ==========================================
        // شناخت عضو (فقط گروه‌ها): شمارنده‌ها + تحلیل دوره‌ای
        // ==========================================

        let before = null;

        if (!isPrivate) {

            primeGroup(msg.chat).catch(() => { });

            const meta = chatMeta.get(chatId);

            const role = meta && meta.ready
                ? (meta.admins.get(userId) || "member")
                : undefined;

            const cls = profiler.classify(text);

            before = await touchMember({
                chatId,
                userId,
                username,
                name: displayName,
                role,
                hour: nowInfo().hour,
                isText: content.kind === "text",
                textLen: cls.len,
                laugh: cls.laugh,
                question: cls.question,
                curse: cls.curse,
                media: content.kind === "sticker" || content.kind === "gif"
            });

            if (profiler.shouldAnalyze(before)) {

                profiler.queueAnalysis(chatId, userId);

            }

        }

        const info = {
            messageId: msg.message_id,
            userId,
            username,
            name: displayName,
            chatType: msg.chat.type,
            title: msg.chat.title || null,
            threadId: msg.is_topic_message ? msg.message_thread_id : undefined,
            text: cleanText,
            kind: content.kind,
            replyToUserId: msg.reply_to_message && msg.reply_to_message.from
                ? String(msg.reply_to_message.from.id)
                : null,
            isNew: !isPrivate && !before,
            absentHours: before && before.lastSeenAt
                ? (Date.now() - new Date(before.lastSeenAt).getTime()) / 3600000
                : null
        };

        console.log("📩 MESSAGE:", trigger, "|", content.full);

        // ==========================================
        // ذخیره در تاریخچه‌ی گروه (همه‌ی پیام‌ها)
        // پیام مشکوک به‌جای متن اصلی ذخیره می‌شه
        // ==========================================

        await saveGroupMessage({
            chatId,
            messageId: msg.message_id,
            userId,
            username,
            name: displayName,
            text: suspicious ? "[پیام مشکوک؛ حذف شد]" : content.full,
            replyToMessageId: msg.reply_to_message
                ? msg.reply_to_message.message_id
                : null,
            isBot: false
        });

        // بعد از ری‌استارت به پیام‌های قدیمی جواب نده
        if (Date.now() / 1000 - msg.date > CONFIG.STALE_SECONDS) return;

        // ==========================================
        // خطاب مستقیم به روبو
        // ==========================================

        if (direct) {

            const replyTo = msg.chat.type === "private" ? null : msg.message_id;

            if (!cleanText) {

                return enqueue(chatId, () =>
                    sendOut(chatId, pick(EMPTY_CALL_LINES), {
                        replyTo,
                        threadId: info.threadId
                    })
                );

            }

            // ضد باینری و prompt injection
            if (suspicious) {

                console.log("🚫 SUSPICIOUS MESSAGE BLOCKED:", cleanText);

                return enqueue(chatId, () =>
                    sendOut(chatId, pick(BLOCK_LINES), {
                        replyTo,
                        threadId: info.threadId
                    })
                );

            }

            // «منو فراموش کن»: پروفایل، حافظه و پیام‌های همین آدم پاک می‌شه
            if (profiler.isForgetRequest(cleanedPlain)) {

                const result = await forgetMember(chatId, userId);

                nameCache.delete(chatId + ":" + userId);

                rosterCache.delete(chatId);

                console.log("🧹 FORGOTTEN:", chatId, userId, result);

                return enqueue(chatId, () =>
                    sendOut(chatId, pick(FORGET_LINES), {
                        replyTo,
                        threadId: info.threadId
                    })
                );

            }

            // لینک سایت
            const lowerText = cleanText.toLowerCase();

            if (
                lowerText.includes("لینک سایت") ||
                lowerText.includes("آدرس سایت") ||
                lowerText.includes("سایت رو بده")
            ) {

                return enqueue(chatId, () =>
                    sendOut(
                        chatId,
                        `🌐 لینک سایت:

https://vfebhebrb-sudo.github.io/Riseo/


هر وقت خواستی بگو:
«روبو لینک سایت رو بده»`,
                        { replyTo, threadId: info.threadId }
                    )
                );

            }

            // درخواست خودش برای لحن («با من ملایم‌تر باش» / «فحشم بده»)
            if (!isPrivate) {

                const tone = profiler.detectToneRequest(cleanedPlain);

                if (tone === "mild") {
                    await setMemberFlags(chatId, userId, { noTeasing: true });
                }
                else if (tone === "spicy") {
                    await setMemberFlags(chatId, userId, { noTeasing: false });
                }

            }

            // تشخیص اسم
            const detectedName = extractName(cleanedPlain);

            if (detectedName) {

                console.log("🧠 NEW NAME:", detectedName);

                nameCache.set(chatId + ":" + userId, {
                    name: detectedName,
                    at: Date.now()
                });

                info.name = detectedName;

            }

            return enqueue(chatId, () =>
                respond({
                    chatId,
                    info,
                    trigger,
                    cleanText,
                    newName: detectedName
                })
            );

        }

        // ==========================================
        // پیام بی‌خطاب توی گروه: شاید دخالت کنه
        // ==========================================

        if (msg.chat.type !== "private" && !suspicious) {

            scheduleProactive(chatId, info);

        }

    }
    catch (error) {

        console.log("❌ ROBO MESSAGE ERROR:", error.message);

    }

}

// ======================================================
// START BOT
// ======================================================

function startBot() {

    if (!TOKEN) {

        console.log("❌ TELEGRAM TOKEN MISSING");

        return;

    }

    bot = new TelegramBot(TOKEN, { polling: true });

    console.log("🤖 ROBO STARTED");

    const ready = bot.getMe()
        .then(me => {

            botInfo = { id: me.id, username: me.username || "" };

            console.log("CONNECTED:", me.username);

        })
        .catch(error => {

            console.log("GETME ERROR:", error.message);

        });

    bot.on("message", async msg => {

        await ready;

        await onMessage(msg);

    });

    // دکمه‌های اینلاین (انتخاب حال‌وهوای گیف، حذف توسط ادمین)
    bot.on("callback_query", query => {

        media
            .onCallback({ tg, adminId: process.env.TELEGRAM_ADMIN_ID }, query)
            .catch(error => console.log("❌ CALLBACK ERROR:", error.message));

    });

    bot.on("polling_error", error => {

        console.log("POLLING ERROR:", error.message);

    });

}

// ======================================================
// NEW FILE NOTIFY
// ======================================================

async function notifyNewFile(data) {

    try {

        const chat = process.env.TELEGRAM_ADMIN_ID;

        if (!chat) return;

        const text = `

📥 فایل جدید سایت


📄 ${data.name}


📚 ${data.lesson || "نامشخص"}


📦 ${data.size} bytes
${data.link ? `\n🔗 ${data.link}\n` : ""}

🤖 Riseo File Bot

`;

        await bot.sendMessage(chat, text);

        console.log("✅ NEW FILE SENT");

    }
    catch (error) {

        console.log("❌ NOTIFY ERROR:", error.message);

    }

}

module.exports = {

    startBot,

    notifyNewFile

};