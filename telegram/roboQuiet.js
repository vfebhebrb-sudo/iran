const mongoose = require("mongoose");
const connectRoboDatabase = require("../database/roboDatabase");

// ======================================================
// CONNECTION (یک بار وصل می‌شه و بین هر دو مدل مشترکه)
// ======================================================

let connectionPromise = null;

function getConnection() {

    if (!connectionPromise) {

        connectionPromise = Promise
            .resolve(connectRoboDatabase())
            .catch(error => {
                connectionPromise = null;
                throw error;
            });

    }

    return connectionPromise;

}

// ======================================================
// ROBO MEMORY SCHEMA (جفت پیام/پاسخ هر کاربر — مثل قبل)
// ======================================================

const RoboMemorySchema = new mongoose.Schema({

    chatId: { type: String, required: true, index: true },

    userId: { type: String, required: true, index: true },

    username: { type: String, default: null },

    name: { type: String, default: null },

    message: { type: String, required: true },

    answer: { type: String, default: null },

    createdAt: { type: Date, default: Date.now, index: true }

});

// ======================================================
// GROUP MESSAGE SCHEMA (تمام پیام‌های گروه، برای فهمیدن بحث)
// بعد از GROUP_TTL_SECONDS خودکار پاک می‌شن
// ======================================================

const GROUP_TTL_SECONDS = 60 * 60 * 24 * 7; // ۷ روز

const GroupMessageSchema = new mongoose.Schema({

    chatId: { type: String, required: true },

    messageId: { type: Number, required: true },

    userId: { type: String, required: true },

    username: { type: String, default: null },

    name: { type: String, default: null },

    text: { type: String, required: true },

    replyToMessageId: { type: Number, default: null },

    isBot: { type: Boolean, default: false },

    createdAt: {
        type: Date,
        default: Date.now,
        expires: GROUP_TTL_SECONDS
    }

});

GroupMessageSchema.index(
    { chatId: 1, messageId: 1 },
    { unique: true }
);

// ======================================================
// MEMBER PROFILE SCHEMA (جدید) — پروفایل هر عضو در هر گروه
// شمارنده‌های رفتاری + چیزی که روبو با هوش مصنوعی یاد گرفته
// TTL ندارد؛ فقط با «منو فراموش کن» پاک می‌شود
// ======================================================

const MemberProfileSchema = new mongoose.Schema({

    chatId: { type: String, required: true },

    userId: { type: String, required: true },

    username: { type: String, default: null },

    name: { type: String, default: null },

    // creator | administrator | member
    role: { type: String, default: "member" },

    msgCount: { type: Number, default: 0 },

    textCount: { type: Number, default: 0 },

    textLenTotal: { type: Number, default: 0 },

    laughCount: { type: Number, default: 0 },

    questionCount: { type: Number, default: 0 },

    curseCount: { type: Number, default: 0 },

    mediaCount: { type: Number, default: 0 },

    // { "0": n, "1": n, ... "23": n } تعداد پیام در هر ساعت (به وقت تهران)
    // عمداً بدون default (تا با $inc روی hours.N تداخل نداشته باشد)
    hours: { type: mongoose.Schema.Types.Mixed },

    firstSeenAt: { type: Date, default: Date.now },

    lastSeenAt: { type: Date, default: Date.now },

    // خودش گفته «با من ملایم‌تر باش»
    noTeasing: { type: Boolean, default: false },

    // خروجی تحلیل هوش مصنوعی (style, humor, tease_ok, likes, notes, nickname, young)
    learned: { type: mongoose.Schema.Types.Mixed, default: null },

    learnedAt: { type: Date, default: null },

    learnedAtCount: { type: Number, default: 0 }

});

MemberProfileSchema.index(
    { chatId: 1, userId: 1 },
    { unique: true }
);

// ======================================================
// MEDIA ITEM SCHEMA (جدید) — کتابخونه‌ی استیکر و گیف روبو
// فایل دانلود نمی‌شه؛ file_id تلگرام ذخیره می‌شه (فایل پیش خودِ تلگرامه
// و ربات می‌تونه هر جا فوری بفرستدش)
// ======================================================

const MediaItemSchema = new mongoose.Schema({

    kind: { type: String, enum: ["sticker", "gif"], required: true, index: true },

    fileId: { type: String, required: true },

    fileUniqueId: { type: String, required: true, unique: true },

    mood: { type: String, default: "misc", index: true },

    emoji: { type: String, default: null },

    setName: { type: String, default: null, index: true },

    setTitle: { type: String, default: null },

    addedBy: { type: String, default: null, index: true },

    addedByName: { type: String, default: null },

    uses: { type: Number, default: 0 },

    lastUsedAt: { type: Date, default: null },

    addedAt: { type: Date, default: Date.now }

});

// ======================================================
// MODEL GETTERS
// ======================================================

const modelCache = new Map();

function modelGetter(name, schema, label) {

    return async function getModel() {

        if (modelCache.has(name)) return modelCache.get(name);

        const connection = await getConnection();

        const model = connection.model(name, schema);

        modelCache.set(name, model);

        console.log(label + " MODEL READY ✅");

        return model;

    };

}

const getRoboMemoryModel = modelGetter("RoboMemory", RoboMemorySchema, "🤖 ROBO MEMORY");

const getGroupMessageModel = modelGetter("GroupMessage", GroupMessageSchema, "💬 GROUP MESSAGE");

const getMemberModel = modelGetter("MemberProfile", MemberProfileSchema, "👥 MEMBER PROFILE");

const getMediaModel = modelGetter("MediaItem", MediaItemSchema, "🎞 MEDIA ITEM");

// ======================================================
// GROUP CHAT REGISTRY — گروه‌هایی که روبو توشونه
// (برای پل مالک پیوی↔گروه و شروع بحثِ خودکار)
// ======================================================

const GroupChatSchema = new mongoose.Schema({

    chatId: { type: String, required: true, unique: true },

    title: { type: String, default: null },

    type: { type: String, default: "supergroup" },

    firstSeenAt: { type: Date, default: Date.now },

    lastSeenAt: { type: Date, default: Date.now },

    // حالت «نظاره‌گر»: کسی گفته روبو وارد بحث نشه و فقط بخونه
    observing: { type: Boolean, default: false }

});

const getGroupChatModel = modelGetter("GroupChat", GroupChatSchema, "🏠 GROUP CHAT");

// ======================================================
// SAVE MEMORY (مثل قبل)
// ======================================================

async function saveMemory(data) {

    try {

        const Model = await getRoboMemoryModel();

        if (!data.chatId || !data.userId || !data.message) {

            console.log("❌ INVALID MEMORY DATA");

            return;

        }

        await Model.create({
            chatId: String(data.chatId),
            userId: String(data.userId),
            username: data.username || null,
            name: data.name || null,
            message: data.message,
            answer: data.answer || null
        });

        // فقط 1000 پیام آخر هر کاربر در هر گروه

        const count = await Model.countDocuments({
            chatId: String(data.chatId),
            userId: String(data.userId)
        });

        if (count > 1000) {

            const remove = count - 1000;

            const old = await Model.find({
                chatId: String(data.chatId),
                userId: String(data.userId)
            })
                .sort({ createdAt: 1 })
                .limit(remove);

            await Model.deleteMany({
                _id: { $in: old.map(x => x._id) }
            });

        }

        console.log("🧠 ROBO MEMORY SAVED");

    }
    catch (error) {

        console.log("❌ ROBO SAVE ERROR:", error.message);

    }

}

// ======================================================
// GET MEMORY USER (مثل قبل)
// ======================================================

async function getMemory(chatId, userId) {

    try {

        const Model = await getRoboMemoryModel();

        const data = await Model.find({
            chatId: String(chatId),
            userId: String(userId)
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return data.reverse();

    }
    catch (error) {

        console.log("❌ MEMORY READ ERROR:", error.message);

        return [];

    }

}

// ======================================================
// GET USER NAME (مثل قبل)
// ======================================================

async function getUserName(chatId, userId) {

    try {

        const Model = await getRoboMemoryModel();

        const user = await Model.findOne({
            chatId: String(chatId),
            userId: String(userId),
            name: { $ne: null }
        })
            .sort({ createdAt: -1 })
            .lean();

        return user?.name || null;

    }
    catch (error) {

        console.log("❌ GET NAME ERROR:", error.message);

        return null;

    }

}

// ======================================================
// SAVE GROUP MESSAGE (جدید)
// ======================================================

async function saveGroupMessage(data) {

    try {

        if (!data.chatId || !data.messageId || !data.text) return;

        const Model = await getGroupMessageModel();

        await Model.create({
            chatId: String(data.chatId),
            messageId: Number(data.messageId),
            userId: String(data.userId),
            username: data.username || null,
            name: data.name || null,
            text: String(data.text).slice(0, 1000),
            replyToMessageId: data.replyToMessageId
                ? Number(data.replyToMessageId)
                : null,
            isBot: Boolean(data.isBot)
        });

    }
    catch (error) {

        // پیام تکراری (11000) مهم نیست
        if (error.code === 11000) return;

        console.log("❌ GROUP SAVE ERROR:", error.message);

    }

}

// ======================================================
// GET RECENT GROUP MESSAGES (جدید) — قدیمی‌ترین اول
// ======================================================

async function getRecentGroupMessages(chatId, limit = 30) {

    try {

        const Model = await getGroupMessageModel();

        const data = await Model.find({ chatId: String(chatId) })
            .sort({ messageId: -1 })
            .limit(limit)
            .lean();

        return data.reverse();

    }
    catch (error) {

        console.log("❌ GROUP READ ERROR:", error.message);

        return [];

    }

}

// ======================================================
// MEMBER PROFILES (جدید)
// ======================================================

// هر پیام یک بار صدا زده می‌شه. برمی‌گردونه «پروفایل قبل از این پیام» یا null (اولین بار)
// soft = true: فقط ثبت اسم/نقش (مثلاً ادمین‌ها یا عضو جدید) بدون شمردن پیام

async function touchMember(data) {

    try {

        if (!data || !data.chatId || !data.userId) return null;

        const Model = await getMemberModel();

        const filter = {
            chatId: String(data.chatId),
            userId: String(data.userId)
        };

        const update = {};

        if (data.soft) {

            const onInsert = {};

            if (data.username) onInsert.username = data.username;

            if (data.name) onInsert.name = data.name;

            if (Object.keys(onInsert).length) update.$setOnInsert = onInsert;

            if (data.role) update.$set = { role: data.role };

        }
        else {

            const inc = { msgCount: 1 };

            if (data.isText) {
                inc.textCount = 1;
                inc.textLenTotal = Math.max(0, Number(data.textLen) || 0);
            }

            if (data.laugh) inc.laughCount = 1;

            if (data.question) inc.questionCount = 1;

            if (data.curse) inc.curseCount = 1;

            if (data.media) inc.mediaCount = 1;

            if (Number.isInteger(data.hour) && data.hour >= 0 && data.hour < 24) {
                inc["hours." + data.hour] = 1;
            }

            const set = { lastSeenAt: new Date() };

            if (data.username !== undefined) set.username = data.username || null;

            if (data.name) set.name = data.name;

            if (data.role) set.role = data.role;

            update.$inc = inc;

            update.$set = set;

        }

        if (!Object.keys(update).length) return null;

        const options = {
            upsert: true,
            new: false,
            setDefaultsOnInsert: true
        };

        try {

            return await Model.findOneAndUpdate(filter, update, options).lean();

        }
        catch (error) {

            // دو پیام هم‌زمان از یک نفر جدید؛ یک بار دیگه تلاش کن
            if (error.code === 11000) {
                return await Model.findOneAndUpdate(filter, update, options).lean();
            }

            throw error;

        }

    }
    catch (error) {

        console.log("❌ MEMBER TOUCH ERROR:", error.message);

        return null;

    }

}

async function getProfiles(chatId, userIds) {

    try {

        if (!userIds || !userIds.length) return [];

        const Model = await getMemberModel();

        return await Model.find({
            chatId: String(chatId),
            userId: { $in: userIds.map(String) }
        }).lean();

    }
    catch (error) {

        console.log("❌ PROFILE READ ERROR:", error.message);

        return [];

    }

}

// اعضایی که روبو می‌شناسه (کسایی که حرف زدن + ادمین‌ها)؛ تازه‌ترین اول

async function getRoster(chatId, limit = 40) {

    try {

        const Model = await getMemberModel();

        return await Model.find({ chatId: String(chatId) })
            .sort({ lastSeenAt: -1 })
            .limit(limit)
            .select("userId username name role msgCount lastSeenAt")
            .lean();

    }
    catch (error) {

        console.log("❌ ROSTER READ ERROR:", error.message);

        return [];

    }

}

async function countKnownMembers(chatId) {

    try {

        const Model = await getMemberModel();

        return await Model.countDocuments({ chatId: String(chatId) });

    }
    catch (error) {

        return 0;

    }

}

async function saveLearned(chatId, userId, learned, atCount) {

    try {

        const Model = await getMemberModel();

        await Model.updateOne(
            { chatId: String(chatId), userId: String(userId) },
            {
                $set: {
                    learned,
                    learnedAt: new Date(),
                    learnedAtCount: Number(atCount) || 0
                }
            }
        );

    }
    catch (error) {

        console.log("❌ LEARNED SAVE ERROR:", error.message);

    }

}

async function setMemberFlags(chatId, userId, flags) {

    try {

        const Model = await getMemberModel();

        const set = {};

        if (typeof flags.noTeasing === "boolean") set.noTeasing = flags.noTeasing;

        if (!Object.keys(set).length) return;

        await Model.updateOne(
            { chatId: String(chatId), userId: String(userId) },
            { $set: set }
        );

    }
    catch (error) {

        console.log("❌ MEMBER FLAG ERROR:", error.message);

    }

}

// آخرین پیام‌های خودِ یک نفر در گروه (قدیمی‌ترین اول)

async function getUserRecentMessages(chatId, userId, limit = 60) {

    try {

        const Model = await getGroupMessageModel();

        const data = await Model.find({
            chatId: String(chatId),
            userId: String(userId),
            isBot: false
        })
            .sort({ messageId: -1 })
            .limit(limit)
            .lean();

        return data.reverse();

    }
    catch (error) {

        console.log("❌ USER MESSAGES READ ERROR:", error.message);

        return [];

    }

}

// «منو فراموش کن»: پروفایل + حافظه‌ی گفتگو + پیام‌های اون آدم توی همین چت

async function forgetMember(chatId, userId) {

    const filter = {
        chatId: String(chatId),
        userId: String(userId)
    };

    const result = { profile: 0, memory: 0, messages: 0 };

    try {

        const [Profile, Memory, Group] = await Promise.all([
            getMemberModel(),
            getRoboMemoryModel(),
            getGroupMessageModel()
        ]);

        const [a, b, c] = await Promise.all([
            Profile.deleteMany(filter),
            Memory.deleteMany(filter),
            Group.deleteMany(filter)
        ]);

        result.profile = a.deletedCount || 0;
        result.memory = b.deletedCount || 0;
        result.messages = c.deletedCount || 0;

    }
    catch (error) {

        console.log("❌ FORGET ERROR:", error.message);

    }

    return result;

}

// ======================================================
// MEDIA LIBRARY (جدید)
// ======================================================

async function addMediaItems(items) {

    try {

        if (!items || !items.length) return { added: 0, total: 0 };

        const Model = await getMediaModel();

        const ops = items.map(item => ({
            updateOne: {
                filter: { fileUniqueId: item.fileUniqueId },
                update: {
                    $setOnInsert: {
                        kind: item.kind,
                        fileId: item.fileId,
                        mood: item.mood || "misc",
                        emoji: item.emoji || null,
                        setName: item.setName || null,
                        setTitle: item.setTitle || null,
                        addedBy: item.addedBy ? String(item.addedBy) : null,
                        addedByName: item.addedByName || null,
                        uses: 0,
                        addedAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        const res = await Model.bulkWrite(ops, { ordered: false });

        const added = res.upsertedCount ?? res.nUpserted ?? 0;

        return { added, total: items.length };

    }
    catch (error) {

        console.log("❌ MEDIA ADD ERROR:", error.message);

        return { added: 0, total: 0 };

    }

}

async function findMediaByUnique(fileUniqueId) {

    try {

        const Model = await getMediaModel();

        return await Model.findOne({ fileUniqueId: String(fileUniqueId) }).lean();

    }
    catch (error) {

        return null;

    }

}

async function mediaSetExists(setName) {

    try {

        const Model = await getMediaModel();

        const found = await Model.findOne({ setName: String(setName) }).select("_id").lean();

        return Boolean(found);

    }
    catch (error) {

        return false;

    }

}

async function setMediaMood(fileUniqueId, mood) {

    try {

        const Model = await getMediaModel();

        await Model.updateOne(
            { fileUniqueId: String(fileUniqueId) },
            { $set: { mood } }
        );

    }
    catch (error) {

        console.log("❌ MEDIA MOOD ERROR:", error.message);

    }

}

// یکی از کم‌استفاده‌ترها رو تصادفی برمی‌داره؛ اگه اون حالت نداشت می‌ره سراغ misc

async function pickMediaItem(kind, mood, excludeUniqueIds = []) {

    try {

        const Model = await getMediaModel();

        const find = async wanted => {

            const filter = { kind, mood: wanted };

            if (excludeUniqueIds.length) {
                filter.fileUniqueId = { $nin: excludeUniqueIds.map(String) };
            }

            return Model.find(filter).sort({ uses: 1 }).limit(12).lean();

        };

        let list = await find(mood);

        if (!list.length && mood !== "misc") list = await find("misc");

        if (!list.length) return null;

        return list[Math.floor(Math.random() * list.length)];

    }
    catch (error) {

        console.log("❌ MEDIA PICK ERROR:", error.message);

        return null;

    }

}

async function touchMediaUse(fileUniqueId) {

    try {

        const Model = await getMediaModel();

        await Model.updateOne(
            { fileUniqueId: String(fileUniqueId) },
            { $inc: { uses: 1 }, $set: { lastUsedAt: new Date() } }
        );

    }
    catch (error) { /* مهم نیست */ }

}

async function deleteMediaItem(fileUniqueId) {

    try {

        const Model = await getMediaModel();

        const res = await Model.deleteOne({ fileUniqueId: String(fileUniqueId) });

        return res.deletedCount || 0;

    }
    catch (error) {

        return 0;

    }

}

async function deleteMediaSet(setName) {

    try {

        const Model = await getMediaModel();

        const res = await Model.deleteMany({ setName: String(setName) });

        return res.deletedCount || 0;

    }
    catch (error) {

        return 0;

    }

}

// همه‌ی استیکرها (تکی و پک‌ها). گیف‌ها دست نمی‌خورن.
// تعداد حذف‌شده‌ها رو برمی‌گردونه؛ null یعنی خطا (که با «هیچی نبود» قاطی نشه)

async function deleteAllStickers() {

    try {

        const Model = await getMediaModel();

        const res = await Model.deleteMany({ kind: "sticker" });

        return res.deletedCount || 0;

    }
    catch (error) {

        console.log("❌ DELETE ALL STICKERS ERROR:", error.message);

        return null;

    }

}

async function countUserMedia(userId) {

    try {

        const Model = await getMediaModel();

        const owner = { addedBy: String(userId) };

        const [gifs, stickers, packs] = await Promise.all([
            Model.countDocuments({ ...owner, kind: "gif" }),
            Model.countDocuments({ ...owner, kind: "sticker" }),
            Model.distinct("setName", { ...owner, setName: { $ne: null } })
        ]);

        return { gifs, stickers, packs: packs.length };

    }
    catch (error) {

        return { gifs: 0, stickers: 0, packs: 0 };

    }

}

// { sticker: {laugh: 12, ...}, gif: {...}, total }

async function getMediaStats() {

    const out = { sticker: {}, gif: {}, total: 0 };

    try {

        const Model = await getMediaModel();

        const rows = await Model.aggregate([
            { $group: { _id: { kind: "$kind", mood: "$mood" }, n: { $sum: 1 } } }
        ]);

        for (const row of rows) {

            const kind = row._id.kind;

            if (!out[kind]) continue;

            out[kind][row._id.mood] = row.n;

            out.total += row.n;

        }

    }
    catch (error) {

        console.log("❌ MEDIA STATS ERROR:", error.message);

    }

    return out;

}

// ======================================================
// GROUP CHATS (جدید)
// ======================================================

async function touchGroupChat(data) {

    try {

        if (!data || !data.chatId) return;

        const Model = await getGroupChatModel();

        const set = { lastSeenAt: new Date() };

        if (data.title) set.title = data.title;

        if (data.type) set.type = data.type;

        await Model.updateOne(
            { chatId: String(data.chatId) },
            { $set: set, $setOnInsert: { firstSeenAt: new Date() } },
            { upsert: true }
        );

    }
    catch (error) {

        if (error.code === 11000) return;

        console.log("❌ GROUP CHAT TOUCH ERROR:", error.message);

    }

}

// فقط گروه‌هایی که توی ۴۵ روز اخیر ازشون پیام دیده شده
async function getKnownGroups(limit = 15) {

    try {

        const Model = await getGroupChatModel();

        return await Model.find({
            lastSeenAt: { $gt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) }
        })
            .sort({ lastSeenAt: -1 })
            .limit(limit)
            .lean();

    }
    catch (error) {

        console.log("❌ KNOWN GROUPS ERROR:", error.message);

        return [];

    }

}

// حالت «نظاره‌گر» (ساکت) برای یه گروه؛ بعد از ری‌استارت هم می‌مونه
async function setGroupObserving(chatId, observing) {

    try {

        const Model = await getGroupChatModel();

        await Model.updateOne(
            { chatId: String(chatId) },
            { $set: { observing: Boolean(observing) }, $setOnInsert: { firstSeenAt: new Date() } },
            { upsert: true }
        );

        return true;

    }
    catch (error) {

        console.log("❌ GROUP OBSERVING SET ERROR:", error.message);

        return false;

    }

}

async function getObservingChatIds() {

    try {

        const Model = await getGroupChatModel();

        const rows = await Model.find({ observing: true }).select("chatId").lean();

        return rows.map(row => String(row.chatId));

    }
    catch (error) {

        console.log("❌ GROUP OBSERVING READ ERROR:", error.message);

        return [];

    }

}

module.exports = {

    getRoboMemoryModel,

    saveMemory,

    getMemory,

    getUserName,

    saveGroupMessage,

    getRecentGroupMessages,

    // --- پروفایل اعضا ---
    touchMember,

    getProfiles,

    getRoster,

    countKnownMembers,

    saveLearned,

    setMemberFlags,

    getUserRecentMessages,

    forgetMember,

    // --- کتابخونه‌ی استیکر و گیف ---
    addMediaItems,

    findMediaByUnique,

    mediaSetExists,

    setMediaMood,

    pickMediaItem,

    touchMediaUse,

    deleteMediaItem,

    deleteMediaSet,

    deleteAllStickers,

    countUserMedia,

    getMediaStats,

    touchGroupChat,

    getKnownGroups,

    setGroupObserving,

    getObservingChatIds

};