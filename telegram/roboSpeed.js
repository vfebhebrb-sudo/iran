// ======================================================
// ROBO SPEED — لایه‌ی سرعتِ روبو
//
// این فایل کنار bot.js می‌شینه و بدون دست زدن به منطقِ روبو:
//  ۱) آخرین پیام‌های هر گروه رو توی رم نگه می‌داره؛ دیگه برای هر پیام
//     کوئریِ دیتابیس نمی‌خوره (getRecentGroupMessages)
//  ۲) نوشتنِ پیام‌های گروه «دسته‌ای و پشت‌صحنه» انجام می‌شه (insertMany هر ~۱ ثانیه)
//  ۳) حافظه‌ی گفتگو، پروفایل اعضا و site context کَش می‌شن
//  ۴) saveMemory دیگه هر بار شمارش و پاکسازی نمی‌کنه
//  ۵) ایندکس‌های ترکیبیِ لازم رو (یک بار، بی‌خطر) می‌سازه
//  ۶) برای هر مرحله زمان‌سنجی می‌کنه تا robo_latency_report.py گزارش بده
//
// نصب (یه خط، اولِ bot.js؛ قبل از require ی سرویس‌ها):
//   require("./roboSpeed").install();
//
// حالت‌ها (متغیر محیطی ROBO_SPEED):
//   on        (پیش‌فرض) شتاب + زمان‌سنجی
//   baseline  فقط زمان‌سنجی بدون هیچ شتابی؛ برای مقایسه‌ی قبل و بعد
//   off       هیچ‌کاری نمی‌کنه (برگشت فوری به رفتار قبلی)
//
// ROBO_SPEED_LOG=off        لاگ زمان‌سنجی نوشته نشه
// ROBO_SPEED_LOG_FILE=...   مسیر لاگ (پیش‌فرض: logs/robo-timing.jsonl)
// ======================================================

"use strict";

const fs = require("fs");
const path = require("path");

const MODE = (() => {

    const value = String(process.env.ROBO_SPEED || "on").toLowerCase();

    return value === "off" || value === "baseline" ? value : "on";

})();

const LOG_ON = String(process.env.ROBO_SPEED_LOG || "on").toLowerCase() !== "off";

const CFG = {

    // چند پیام آخرِ هر گروه توی رم (CONTEXT_MESSAGES توی bot.js = 30)
    RING_SIZE: 60,

    RING_MAX_CHATS: 200,

    // نوشتن دسته‌ای
    FLUSH_MS: 800,
    FLUSH_BATCH: 60,
    QUEUE_HARD_MAX: 3000,

    // کَش‌ها
    MEMORY_TTL_MS: 10 * 60 * 1000,
    MEMORY_MAX_KEYS: 500,
    PROFILE_TTL_MS: 15 * 1000,
    PROFILE_MAX_KEYS: 2000,
    SITE_TTL_MS: 60 * 1000,

    // saveMemory: هر چند ذخیره یک بار پاکسازی؛ و نگه‌داشتنِ چند مورد
    TRIM_EVERY: 20,
    KEEP_MEMORY: 1000,

    // زمان‌سنجی
    LOG_FILE: process.env.ROBO_SPEED_LOG_FILE || path.join(process.cwd(), "logs", "robo-timing.jsonl"),
    LOG_MAX_BYTES: 8 * 1024 * 1024,
    LOG_FLUSH_MS: 2000,
    SUMMARY_EVERY_MS: 60 * 1000,
    WINDOW: 300

};

// ======================================================
// زمان‌سنجی (آمار + لاگ)
// ======================================================

const samples = new Map();

const counters = new Map();

let dirty = false;

function count(name) {

    counters.set(name, (counters.get(name) || 0) + 1);

}

let logBuffer = [];

let logTimer = null;

function writeLog(sync) {

    logTimer = null;

    if (!logBuffer.length) return;

    const text = logBuffer.join("\n") + "\n";

    logBuffer = [];

    try {

        fs.mkdirSync(path.dirname(CFG.LOG_FILE), { recursive: true });

        try {
            if (fs.statSync(CFG.LOG_FILE).size > CFG.LOG_MAX_BYTES) {
                fs.renameSync(CFG.LOG_FILE, CFG.LOG_FILE + ".1");
            }
        }
        catch (e) { /* فایل هنوز نیست */ }

        if (sync) fs.appendFileSync(CFG.LOG_FILE, text);
        else fs.appendFile(CFG.LOG_FILE, text, () => { });

    }
    catch (error) {

        console.log("❌ SPEED LOG ERROR:", error.message);

    }

}

function logLine(obj) {

    if (!LOG_ON) return;

    logBuffer.push(JSON.stringify(obj));

    if (!logTimer) {
        logTimer = setTimeout(() => writeLog(false), CFG.LOG_FLUSH_MS);
        logTimer.unref();
    }

}

function record(label, ms, ok) {

    let list = samples.get(label);

    if (!list) {
        list = [];
        samples.set(label, list);
    }

    list.push(ms);

    if (list.length > CFG.WINDOW) list.shift();

    dirty = true;

    logLine({ t: Date.now(), l: label, ms: Math.round(ms * 10) / 10, ok: ok ? 1 : 0 });

}

function timed(label, fn) {

    if (typeof fn !== "function") return fn;

    return async function timedCall(...args) {

        const start = process.hrtime.bigint();

        let ok = true;

        try {
            return await fn.apply(this, args);
        }
        catch (error) {
            ok = false;
            throw error;
        }
        finally {
            record(label, Number(process.hrtime.bigint() - start) / 1e6, ok);
        }

    };

}

function percentile(sorted, p) {

    if (!sorted.length) return 0;

    return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];

}

function stats() {

    const out = {};

    for (const [label, list] of samples) {

        const sorted = list.slice().sort((a, b) => a - b);

        out[label] = {
            n: sorted.length,
            p50: percentile(sorted, 0.5),
            p95: percentile(sorted, 0.95),
            max: sorted[sorted.length - 1] || 0
        };

    }

    return { mode: MODE, timings: out, cache: Object.fromEntries(counters) };

}

function printSummary() {

    if (!dirty) return;

    dirty = false;

    const parts = [];

    for (const [label, row] of Object.entries(stats().timings)) {
        parts.push(`${label} p50=${row.p50.toFixed(1)} p95=${row.p95.toFixed(1)}ms n=${row.n}`);
    }

    console.log(`⚡ SPEED [${MODE}] | ` + parts.join(" | "));

    if (counters.size) logLine({ t: Date.now(), l: "cache", c: Object.fromEntries(counters) });

}

// ======================================================
// ORIGINALS (قبل از جایگزین شدن ذخیره می‌شن)
// ======================================================

const orig = {};

const siteOrig = {};

// ======================================================
// MODELS + INDEXES
// ======================================================

let modelsPromise = null;

function getModels() {

    if (!modelsPromise) {

        modelsPromise = (async () => {

            const base = await orig.getRoboMemoryModel();

            // سرویس مدل‌ها رو خودش با اولین خوانشِ بی‌ضرر می‌سازه
            await Promise.all([
                orig.getRecentGroupMessages("__warm__", 1),
                orig.getProfiles("__warm__", ["0"]),
                orig.findMediaByUnique("__warm__")
            ]);

            const models = base.db && base.db.models ? base.db.models : {};

            return {
                memory: base,
                group: models.GroupMessage || null,
                member: models.MemberProfile || null,
                media: models.MediaItem || null
            };

        })().catch(error => {

            modelsPromise = null;

            throw error;

        });

    }

    return modelsPromise;

}

// ایندکس‌های ترکیبی؛ idempotent هستن و اگه از قبل باشن هیچ اتفاقی نمی‌افته
async function ensureIndexes() {

    try {

        const m = await getModels();

        const plan = [
            [m.memory, { chatId: 1, userId: 1, createdAt: -1 }, "robo_chat_user_created"],
            [m.group, { chatId: 1, userId: 1, messageId: -1 }, "robo_chat_user_msg"],
            [m.member, { chatId: 1, lastSeenAt: -1 }, "robo_chat_lastseen"],
            [m.media, { kind: 1, mood: 1, uses: 1 }, "robo_kind_mood_uses"]
        ];

        for (const [model, keys, name] of plan) {

            if (!model || !model.collection) continue;

            try {
                await model.collection.createIndex(keys, { name });
            }
            catch (error) {
                console.log("⚠️ SPEED INDEX SKIPPED:", name, "-", error.message);
            }

        }

        console.log("⚡ SPEED INDEXES READY");

    }
    catch (error) {

        console.log("⚠️ SPEED INDEX ERROR:", error.message);

    }

}

// ======================================================
// GROUP MESSAGES — رم + نوشتن پشت‌صحنه
// ======================================================

const rings = new Map();

function ringOf(chatId) {

    let ring = rings.get(chatId);

    if (ring) {
        rings.delete(chatId);
        rings.set(chatId, ring);
        return ring;
    }

    if (rings.size >= CFG.RING_MAX_CHATS) rings.delete(rings.keys().next().value);

    ring = { docs: [], hydrated: false, loading: null };

    rings.set(chatId, ring);

    return ring;

}

// ترتیب بر اساس messageId؛ تکراری‌ها نادیده گرفته می‌شن
function pushRing(ring, doc) {

    const docs = ring.docs;

    const last = docs[docs.length - 1];

    if (!last || doc.messageId > last.messageId) {
        docs.push(doc);
    }
    else {

        let i = docs.length;

        while (i > 0 && docs[i - 1].messageId > doc.messageId) i--;

        if (i > 0 && docs[i - 1].messageId === doc.messageId) return;

        docs.splice(i, 0, doc);

    }

    if (docs.length > CFG.RING_SIZE) docs.splice(0, docs.length - CFG.RING_SIZE);

}

function cleanDoc(row) {

    return {
        chatId: row.chatId,
        messageId: row.messageId,
        userId: row.userId,
        username: row.username || null,
        name: row.name || null,
        text: row.text,
        replyToMessageId: row.replyToMessageId || null,
        isBot: Boolean(row.isBot),
        createdAt: row.createdAt
    };

}

async function hydrate(ring, chatId) {

    if (ring.hydrated) return;

    if (!ring.loading) {

        ring.loading = orig.getRecentGroupMessages(chatId, CFG.RING_SIZE)
            .then(rows => {

                for (const row of rows) pushRing(ring, cleanDoc(row));

                // نتیجه‌ی خالی یعنی گروه تازه‌ست یا دیتابیس مشکل داشته؛ دفعه‌ی بعد دوباره تلاش می‌شه
                if (rows.length) ring.hydrated = true;

            })
            .finally(() => { ring.loading = null; });

    }

    await ring.loading;

}

async function fastGetRecent(chatId, limit = 30) {

    const want = Math.max(1, Number(limit) || 30);

    if (want > CFG.RING_SIZE) return orig.getRecentGroupMessages(chatId, want);

    const id = String(chatId);

    const ring = ringOf(id);

    if (!ring.hydrated) {
        count("recent.miss");
        await hydrate(ring, id);
    }
    else {
        count("recent.hit");
    }

    return ring.docs.slice(-want).map(doc => ({ ...doc }));

}

// ---------- صفِ نوشتن ----------

let queue = [];

let flushTimer = null;

let flushing = null;

function isDuplicateOnly(error) {

    if (!error) return false;

    if (error.code === 11000) return true;

    const list = error.writeErrors || (error.result && error.result.result && error.result.result.writeErrors);

    return Array.isArray(list) && list.length > 0 && list.every(w => (w.code ?? (w.err && w.err.code)) === 11000);

}

async function writeBatch(batch) {

    let Model = null;

    try {
        Model = (await getModels()).group;
    }
    catch (error) { /* می‌افتیم روی روش قدیمی */ }

    if (!Model) {

        for (const doc of batch) await orig.saveGroupMessage(doc);

        return;

    }

    try {
        await Model.insertMany(batch, { ordered: false });
    }
    catch (error) {

        if (isDuplicateOnly(error)) return;

        throw error;

    }

}

function flush() {

    if (flushing) return flushing;

    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }

    flushing = (async () => {

        while (queue.length) {

            const batch = queue.splice(0, 200);

            try {
                await writeBatch(batch);
            }
            catch (error) {

                console.log("❌ SPEED FLUSH ERROR:", error.message);

                // برگردون سرِ صف؛ تایمر بعدی دوباره تلاش می‌کنه
                queue = batch.concat(queue).slice(-CFG.QUEUE_HARD_MAX);

                scheduleFlush();

                break;

            }

        }

    })().finally(() => { flushing = null; });

    return flushing;

}

function scheduleFlush() {

    if (flushTimer) return;

    flushTimer = setTimeout(() => {
        flushTimer = null;
        flush();
    }, CFG.FLUSH_MS);

    flushTimer.unref();

}

async function fastSaveGroupMessage(data) {

    try {

        if (!data || !data.chatId || !data.messageId || !data.text) return;

        const doc = {
            chatId: String(data.chatId),
            messageId: Number(data.messageId),
            userId: String(data.userId),
            username: data.username || null,
            name: data.name || null,
            text: String(data.text).slice(0, 1000),
            replyToMessageId: data.replyToMessageId ? Number(data.replyToMessageId) : null,
            isBot: Boolean(data.isBot),
            createdAt: new Date()
        };

        pushRing(ringOf(doc.chatId), doc);

        queue.push(doc);

        if (queue.length > CFG.QUEUE_HARD_MAX) queue.shift();

        if (queue.length >= CFG.FLUSH_BATCH) flush();
        else scheduleFlush();

    }
    catch (error) {

        console.log("❌ SPEED GROUP SAVE ERROR:", error.message);

    }

}

// ======================================================
// MEMORY (جفت پیام/پاسخ)
// ======================================================

const memCache = new Map();

const saveCounts = new Map();

const memKey = (chatId, userId) => `${chatId}:${userId}`;

function bounded(map, max) {

    while (map.size > max) map.delete(map.keys().next().value);

}

async function fastGetMemory(chatId, userId) {

    const key = memKey(chatId, userId);

    const hit = memCache.get(key);

    if (hit && Date.now() - hit.at < CFG.MEMORY_TTL_MS) {
        count("memory.hit");
        return hit.docs.map(doc => ({ ...doc }));
    }

    count("memory.miss");

    const docs = await orig.getMemory(chatId, userId);

    // نتیجه‌ی خالی کَش نمی‌شه (کاربر تازه یا خطای دیتابیس)
    if (docs.length) {
        memCache.set(key, { at: Date.now(), docs: docs.map(doc => ({ ...doc })) });
        bounded(memCache, CFG.MEMORY_MAX_KEYS);
    }

    return docs;

}

async function trimMemory(Model, chatId, userId) {

    try {

        const edge = await Model.find({ chatId, userId })
            .sort({ createdAt: -1 })
            .skip(CFG.KEEP_MEMORY - 1)
            .limit(1)
            .select("createdAt")
            .lean();

        if (edge.length) {
            await Model.deleteMany({ chatId, userId, createdAt: { $lt: edge[0].createdAt } });
        }

    }
    catch (error) {

        console.log("⚠️ SPEED TRIM ERROR:", error.message);

    }

}

async function fastSaveMemory(data) {

    try {

        const Model = await orig.getRoboMemoryModel();

        if (!data || !data.chatId || !data.userId || !data.message) {

            console.log("❌ INVALID MEMORY DATA");

            return;

        }

        const chatId = String(data.chatId);

        const userId = String(data.userId);

        const created = await Model.create({
            chatId,
            userId,
            username: data.username || null,
            name: data.name || null,
            message: data.message,
            answer: data.answer || null
        });

        const key = memKey(chatId, userId);

        const hit = memCache.get(key);

        if (hit) {

            hit.docs.push(created.toObject ? created.toObject() : { ...created });

            if (hit.docs.length > 20) hit.docs.shift();

        }

        // بار اول بعد از ری‌استارت و بعد هر N ذخیره؛ پاکسازی با ایندکس انجام می‌شه
        const n = (saveCounts.get(key) || 0) + 1;

        saveCounts.set(key, n);

        bounded(saveCounts, CFG.MEMORY_MAX_KEYS * 4);

        if (n === 1 || n % CFG.TRIM_EVERY === 0) trimMemory(Model, chatId, userId);

        console.log("🧠 ROBO MEMORY SAVED");

    }
    catch (error) {

        console.log("❌ ROBO SAVE ERROR:", error.message);

    }

}

// ======================================================
// PROFILES
// ======================================================

const profCache = new Map();

const profGen = new Map();

function invalidateProfile(chatId, userId) {

    const key = memKey(chatId, userId);

    profCache.delete(key);

    profGen.set(key, (profGen.get(key) || 0) + 1);

    if (profGen.size > 5000) profGen.clear();

}

async function fastGetProfiles(chatId, userIds) {

    if (!userIds || !userIds.length) return [];

    const ids = [...new Set(userIds.map(String))];

    const found = new Map();

    const missing = [];

    const now = Date.now();

    for (const id of ids) {

        const hit = profCache.get(memKey(chatId, id));

        if (hit && now - hit.at < CFG.PROFILE_TTL_MS) {
            found.set(id, hit.doc);
        }
        else {
            missing.push(id);
        }

    }

    count("profile.hit");

    if (missing.length) {

        count("profile.miss");

        const gens = new Map(missing.map(id => [id, profGen.get(memKey(chatId, id)) || 0]));

        const rows = await orig.getProfiles(chatId, missing);

        for (const row of rows) {

            const id = String(row.userId);

            found.set(id, row);

            const key = memKey(chatId, id);

            // اگه وسط خوانش پروفایل عوض شده، کَش نکن
            if ((profGen.get(key) || 0) === (gens.get(id) || 0)) {
                profCache.set(key, { at: Date.now(), doc: row });
            }

        }

        bounded(profCache, CFG.PROFILE_MAX_KEYS);

    }

    return ids.filter(id => found.has(id)).map(id => ({ ...found.get(id) }));

}

async function fastTouchMember(data) {

    try {
        return await orig.touchMember(data);
    }
    finally {
        if (data && data.chatId && data.userId) invalidateProfile(data.chatId, data.userId);
    }

}

async function fastSaveLearned(chatId, userId, ...rest) {

    try {
        return await orig.saveLearned(chatId, userId, ...rest);
    }
    finally {
        invalidateProfile(chatId, userId);
    }

}

async function fastSetMemberFlags(chatId, userId, flags) {

    try {
        return await orig.setMemberFlags(chatId, userId, flags);
    }
    finally {
        invalidateProfile(chatId, userId);
    }

}

// «منو فراموش کن»: هر چیزی که از اون آدم توی رم یا صف مونده هم باید پاک بشه
function purgeUser(chatId, userId) {

    const id = String(chatId);

    const uid = String(userId);

    queue = queue.filter(doc => !(doc.chatId === id && doc.userId === uid));

    const ring = rings.get(id);

    if (ring) ring.docs = ring.docs.filter(doc => doc.userId !== uid);

    invalidateProfile(id, uid);

    memCache.delete(memKey(id, uid));

    saveCounts.delete(memKey(id, uid));

}

async function fastForgetMember(chatId, userId) {

    purgeUser(chatId, userId);

    // نوشتنِ در حال انجام تموم بشه تا بعد از پاک شدن زنده نشه
    await flush();

    const result = await orig.forgetMember(chatId, userId);

    purgeUser(chatId, userId);

    return result;

}

// ======================================================
// SITE CONTEXT
// ======================================================

const site = { at: 0, value: null, inflight: null };

async function fastSiteContext() {

    if (site.value !== null && Date.now() - site.at < CFG.SITE_TTL_MS) {
        count("site.hit");
        return site.value;
    }

    if (site.inflight) return site.inflight;

    count("site.miss");

    site.inflight = siteOrig.getSiteContext()
        .then(value => {
            site.value = value;
            site.at = Date.now();
            return value;
        })
        .finally(() => { site.inflight = null; });

    return site.inflight;

}

async function fastUpdateSiteBrain(...args) {

    try {
        return await siteOrig.updateSiteBrain(...args);
    }
    finally {
        site.value = null;
    }

}

// ======================================================
// INSTALL
// ======================================================

let installed = false;

const SERVICE_FUNCTIONS = [
    "getRecentGroupMessages",
    "saveGroupMessage",
    "touchMember",
    "getProfiles",
    "getMemory",
    "saveMemory",
    "getUserRecentMessages",
    "saveLearned",
    "setMemberFlags",
    "forgetMember"
];

function hookShutdown() {

    for (const signal of ["SIGINT", "SIGTERM"]) {

        process.once(signal, () => {

            const done = () => {

                writeLog(true);

                // اگه کس دیگه‌ای هندلر نذاشته بود، رفتار پیش‌فرض (بسته شدن) رو برگردون
                if (process.listenerCount(signal) === 0) process.kill(process.pid, signal);

            };

            Promise.race([flush(), new Promise(resolve => setTimeout(resolve, 2500))]).then(done, done);

        });

    }

    process.on("beforeExit", () => {
        if (queue.length) flush();
    });

    process.on("exit", () => writeLog(true));

}

function install() {

    if (installed) return api;

    installed = true;

    if (MODE === "off") {

        console.log("⚡ ROBO SPEED: OFF");

        return api;

    }

    const svc = require("../services/roboMemoryService");

    const siteBrain = require("../services/siteBrainService");

    for (const name of Object.keys(svc)) orig[name] = svc[name];

    siteOrig.getSiteContext = siteBrain.getSiteContext;

    siteOrig.updateSiteBrain = siteBrain.updateSiteBrain;

    const fast = MODE === "on"
        ? {
            getRecentGroupMessages: fastGetRecent,
            saveGroupMessage: fastSaveGroupMessage,
            touchMember: fastTouchMember,
            getProfiles: fastGetProfiles,
            getMemory: fastGetMemory,
            saveMemory: fastSaveMemory,
            saveLearned: fastSaveLearned,
            setMemberFlags: fastSetMemberFlags,
            forgetMember: fastForgetMember
        }
        : {};

    for (const name of SERVICE_FUNCTIONS) {

        if (typeof orig[name] !== "function") continue;

        svc[name] = timed("db." + name, fast[name] || orig[name]);

    }

    if (typeof siteBrain.getSiteContext === "function") {

        siteBrain.getSiteContext = timed(
            "db.getSiteContext",
            MODE === "on" ? fastSiteContext : siteOrig.getSiteContext
        );

        if (MODE === "on" && typeof siteOrig.updateSiteBrain === "function") {
            siteBrain.updateSiteBrain = fastUpdateSiteBrain;
        }

    }

    // مغز و سرچ فقط زمان‌سنجی می‌شن (رفتارشون عوض نمی‌شه)
    try {
        const brain = require("./roboBrain");
        brain.think = timed("ai.think", brain.think);
    }
    catch (error) {
        console.log("⚠️ SPEED: think timing skipped:", error.message);
    }

    try {
        const search = require("./roboSearch");
        search.lookup = timed("ai.search", search.lookup);
    }
    catch (error) {
        console.log("⚠️ SPEED: search timing skipped:", error.message);
    }

    hookShutdown();

    const timer = setInterval(printSummary, CFG.SUMMARY_EVERY_MS);

    timer.unref();

    if (MODE === "on") {

        const startup = setTimeout(ensureIndexes, 5000);

        startup.unref();

    }

    console.log(`⚡ ROBO SPEED: ${MODE.toUpperCase()}${LOG_ON ? " | log → " + CFG.LOG_FILE : ""}`);

    return api;

}

const api = { install, stats, flush, timed };

module.exports = api;