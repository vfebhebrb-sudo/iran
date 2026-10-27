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

let RoboMemoryModel = null;
let GroupMessageModel = null;

// ======================================================
// GET MODELS
// ======================================================

async function getRoboMemoryModel() {

    if (RoboMemoryModel) return RoboMemoryModel;

    const connection = await getConnection();

    RoboMemoryModel = connection.model("RoboMemory", RoboMemorySchema);

    console.log("🤖 ROBO MEMORY MODEL READY ✅");

    return RoboMemoryModel;

}

async function getGroupMessageModel() {

    if (GroupMessageModel) return GroupMessageModel;

    const connection = await getConnection();

    GroupMessageModel = connection.model("GroupMessage", GroupMessageSchema);

    console.log("💬 GROUP MESSAGE MODEL READY ✅");

    return GroupMessageModel;

}

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

module.exports = {

    getRoboMemoryModel,

    saveMemory,

    getMemory,

    getUserName,

    saveGroupMessage,

    getRecentGroupMessages

};