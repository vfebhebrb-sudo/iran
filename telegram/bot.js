// ======================================================
// TELEGRAM SMART ROBO BOT
// ======================================================

const TelegramBot = require("node-telegram-bot-api");

const fs = require("fs");

const path = require("path");

const {
    saveMemory,
    getMemory,
    getUserName,
    saveGroupMessage,
    getRecentGroupMessages
} = require("../services/roboMemoryService");

const { getSiteContext } = require("../services/siteBrainService");

const { isBinaryMessage, isPromptInjection } = require("./guards");

const { think, normalizeEmoji, ALLOWED_REACTIONS } = require("./roboBrain");

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
    CONTEXT_MESSAGES: 25,

    // بعد از آخرین پیام گروه، چند میلی‌ثانیه صبر کنه تا ببینه بحث تموم شد
    DEBOUNCE_MS: 4000,

    // حداکثر انتظار (وسط گفتگوی شلوغ هم گاهی فرصت دخالت پیدا کنه)
    MAX_WAIT_MS: 20000,

    // احتمال پایه‌ی اینکه اصلاً به یه پیام بی‌خطاب فکر کنه (۰ تا ۱)
    BASE_CHANCE: 0.35,

    // حداقل فاصله بین دو دخالت خودخواسته‌ی روبو
    COOLDOWN_MS: 60 * 1000,

    // حداکثر دخالت خودخواسته در ساعت برای هر گروه
    MAX_PROACTIVE_PER_HOUR: 10,

    // پیام‌های قدیمی‌تر از این (ثانیه) رو بعد از ری‌استارت جواب نده
    STALE_SECONDS: 120,

    // ساعت‌هایی که فقط وقتی صداش بزنن جواب می‌ده (مثل آدمی که خوابه)
    // برای خاموش کردن: QUIET_HOURS: null
    QUIET_HOURS: { start: 2, end: 8 },

    TIMEZONE: "Asia/Tehran"

};

// ======================================================
// SMALL HELPERS
// ======================================================

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const rand = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

const pick = list => list[Math.floor(Math.random() * list.length)];

const SITE_WORDS = /سایت|فایل|درس|جزوه|ریزئو|riseo|pdf|دانلود|نمونه\s?سوال|امتحان|کتاب/i;

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

async function setReaction(chatId, messageId, emoji) {

    const normalized = normalizeEmoji(emoji);

    if (!normalized || !ALLOWED_REACTIONS.has(normalized)) return;

    try {

        // مستقیم با API تلگرام (به نسخه‌ی کتابخانه وابسته نیست؛ نیاز به Node 18+)
        const response = await fetch(
            `https://api.telegram.org/bot${TOKEN}/setMessageReaction`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    reaction: [{ type: "emoji", emoji: normalized }]
                })
            }
        );

        const data = await response.json();

        if (!data.ok) {
            console.log("REACTION ERROR:", data.description);
        }
        else {
            console.log("👍 REACTED:", normalized, "→", messageId);
        }

    }
    catch (error) {

        console.log("REACTION ERROR:", error.message);

    }

}

function startTyping(chatId, threadId) {

    let active = true;

    const tick = () => {

        if (!active) return;

        bot
            .sendChatAction(
                chatId,
                "typing",
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

function isQuietHour() {

    const quiet = CONFIG.QUIET_HOURS;

    if (!quiet) return false;

    const hour = Number(
        new Intl.DateTimeFormat("en-GB", {
            hour: "numeric",
            hourCycle: "h23",
            timeZone: CONFIG.TIMEZONE
        }).format(new Date())
    );

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
            lastInfo: null
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
// PROACTIVE (دخالت خودخواسته مثل آدم)
// ======================================================

function interestChance(text) {

    const value = String(text || "").trim();

    let chance = CONFIG.BASE_CHANCE;

    if (/[?؟]/.test(value)) chance += 0.3;

    if (value.length < 4) chance -= 0.2;

    if (value.length > 60) chance += 0.1;

    if (SITE_WORDS.test(value)) chance += 0.2;

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

    if (Math.random() > interestChance(info.text)) return;

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
// RESPOND — فکر کردن، تصمیم، ریکشن/ریپلای
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

        decision = await think({
            recent,
            trigger,
            chatType: info.chatType,
            chatTitle: info.title,
            speakerName: info.name,
            userMemory,
            siteContext,
            lastBotAgoSec: state.lastBotAt
                ? Math.round((Date.now() - state.lastBotAt) / 1000)
                : null
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

    // ----- جواب -----

    let replyTo = null;

    if (!isPrivate) {

        replyTo = decision.replyTo || (direct ? info.messageId : null);

    }

    await humanWait(chatId, info.threadId, decision.text.length, direct);

    const sent = await sendOut(chatId, decision.text, {
        replyTo,
        threadId: info.threadId
    });

    console.log("✅ SENT:", sent.message_id);

    state.lastBotAt = Date.now();

    if (!direct) {

        state.lastProactiveAt = Date.now();

        state.proactiveTimes.push(Date.now());

    }

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

    // حافظه‌ی کاربر (مثل قبل) فقط وقتی مستقیم باهاش حرف زدن

    if (direct) {

        await saveMemory({
            chatId,
            userId: info.userId,
            username: info.username,
            name: newName || null,
            message: cleanText,
            answer: decision.text
        });

    }

}

// ======================================================
// MESSAGE HANDLER
// ======================================================

async function onMessage(msg) {

    try {

        if (!msg.from || msg.from.is_bot) return;

        const text = (msg.text || msg.caption || "").trim();

        if (!text) return;

        // دستورات اسلش (/start و ...) نادیده
        if (text.startsWith("/")) return;

        // ==========================================
        // دستورات فایل (مستقل از روبو)
        // ==========================================

        if (text === "لیست فایل ها") {

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
        const fileMatch = text.match(/^دریافت\s+(\d+)$/);

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

        const cleanText = direct ? cleanMessage(text) : text;

        const suspicious = direct
            ? (isBinaryMessage(text) || isPromptInjection(cleanText))
            : (isBinaryMessage(text) || isPromptInjection(text));

        const displayName = await resolveName(chatId, userId, msg.from);

        const info = {
            messageId: msg.message_id,
            userId,
            username,
            name: displayName,
            chatType: msg.chat.type,
            title: msg.chat.title || null,
            threadId: msg.is_topic_message ? msg.message_thread_id : undefined,
            text: cleanText
        };

        console.log("📩 MESSAGE:", trigger, "|", text);

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
            text: suspicious ? "[پیام مشکوک؛ حذف شد]" : text,
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

            // تشخیص اسم
            const detectedName = extractName(cleanText);

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