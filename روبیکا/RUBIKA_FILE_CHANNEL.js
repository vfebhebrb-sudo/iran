// ======================================================
// RUBIKA FILE CHANNEL BOT
// مرحله 1 — دریافت پیام و پاسخ
// ======================================================

require("dotenv").config();

const axios = require("axios");

// ======================================================
// TOKEN
// ======================================================

const TOKEN =
    process.env.RUBIKA_FILE_CHANNEL_BOT_TOKEN;

if (!TOKEN) {
    console.error(
        "❌ RUBIKA_FILE_CHANNEL_BOT_TOKEN پیدا نشد!"
    );
}

// ======================================================
// API
// ======================================================

const api = axios.create({
    timeout: 15000,
    headers: {
        "Content-Type": "application/json"
    }
});

// ======================================================
// OFFSET
// ======================================================

let offset_id = null;
let running = false;

// ======================================================
// SEND MESSAGE
// ======================================================

async function sendMessage(chatId, text) {

    if (!TOKEN) {
        throw new Error(
            "توکن ربات فایل کانال وجود ندارد."
        );
    }

    if (!chatId) {
        throw new Error(
            "Chat ID وجود ندارد."
        );
    }

    try {

        const payload = {
            chat_id: String(chatId).trim(),
            text: String(text)
        };

        console.log("");
        console.log(
            "╔══════════════════════════════════════╗"
        );
        console.log(
            "║       📤 FILE BOT SEND MESSAGE       ║"
        );
        console.log(
            "╚══════════════════════════════════════╝"
        );

        console.log(
            "👤 CHAT ID:",
            payload.chat_id
        );

        console.log(
            "📝 TEXT:",
            payload.text
        );

        const response = await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/sendMessage`,

            payload

        );

        const data =
            response.data;

        console.log(
            "📡 RUBIKA RESPONSE:"
        );

        console.log(
            JSON.stringify(
                data,
                null,
                2
            )
        );

        if (
            !data ||
            data.status !== "OK"
        ) {

            const errorMessage =
                data?.message ||
                data?.error ||
                `Rubika API status: ${
                    data?.status || "UNKNOWN"
                }`;

            console.error(
                "❌ ارسال پیام رد شد:",
                errorMessage
            );

            throw new Error(
                errorMessage
            );
        }

        console.log(
            "✅ پیام با موفقیت ارسال شد"
        );

        console.log(
            "🆔 MESSAGE ID:",
            data.data?.message_id || "N/A"
        );

        console.log("");

        return data;

    }
    catch (error) {

        console.error("");
        console.error(
            "╔══════════════════════════════════════╗"
        );
        console.error(
            "║       ❌ FILE BOT SEND FAILED        ║"
        );
        console.error(
            "╚══════════════════════════════════════╝"
        );

        console.error(
            "HTTP STATUS:",
            error.response?.status || "N/A"
        );

        console.error(
            "RUBIKA RESPONSE:",
            JSON.stringify(
                error.response?.data,
                null,
                2
            )
        );

        console.error(
            "ERROR:",
            error.message
        );

        console.error("");

        throw error;
    }
}

// ======================================================
// GET BOT INFO
// ======================================================

async function getBotInfo() {

    try {

        const response = await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/getMe`

        );

        console.log("");
        console.log(
            "╔══════════════════════════════════════╗"
        );
        console.log(
            "║       🤖 FILE CHANNEL BOT INFO       ║"
        );
        console.log(
            "╚══════════════════════════════════════╝"
        );

        console.log(
            JSON.stringify(
                response.data,
                null,
                2
            )
        );

        console.log("");

        return response.data;

    }
    catch (error) {

        console.error(
            "❌ GET BOT INFO ERROR:",
            error.response?.data ||
            error.message
        );

        return null;
    }
}

// ======================================================
// PROCESS MESSAGE
// ======================================================

async function processUpdate(update) {

    if (!update) {
        return;
    }

    // فقط پیام‌های جدید
    if (
        update.type !== "NewMessage"
    ) {
        return;
    }

    const message =
        update.new_message;

    if (!message) {
        return;
    }

    const text =
        message.text || "";

    const chatId =
        message.chat_id ||
        update.chat_id ||
        null;

    console.log("");
    console.log(
        "╔══════════════════════════════════════╗"
    );
    console.log(
        "║       📥 FILE BOT NEW MESSAGE        ║"
    );
    console.log(
        "╚══════════════════════════════════════╝"
    );

    console.log(
        "👤 CHAT ID:",
        chatId
    );

    console.log(
        "📝 TEXT:",
        text || "(بدون متن)"
    );

    console.log(
        "👤 SENDER:",
        message.sender_id || "N/A"
    );

    console.log("");

    if (!chatId) {

        console.log(
            "⚠️ chatId پیدا نشد."
        );

        return;
    }

    // ==================================================
    // /start
    // ==================================================

    if (
        text.trim() === "/start"
    ) {

        await sendMessage(
            chatId,

`🤖 ربات فایل سایت فعال شد!

سلام 👋

ربات با موفقیت پیام شما را دریافت کرد.

✅ اتصال به ربات برقرار است.

🆔 Chat ID:

${chatId}`
        );

        return;
    }

    // ==================================================
    // سلام
    // ==================================================

    if (
        text.trim() === "سلام"
    ) {

        await sendMessage(
            chatId,

`سلام 👋

🤖 ربات فایل سایت فعاله!

پیامت رو دریافت کردم ✅

🆔 Chat ID:

${chatId}`
        );

        return;
    }

    // ==================================================
    // هر پیام دیگری
    // ==================================================

    await sendMessage(
        chatId,

`📩 پیامت دریافت شد!

📝 متن پیام:

${text || "بدون متن"}

✅ ربات به درستی در حال کار است.`
    );
}

// ======================================================
// GET UPDATES
// ======================================================

async function getUpdates() {

    if (running) {
        return;
    }

    if (!TOKEN) {
        return;
    }

    running = true;

    try {

        const response = await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/getUpdates`,

            {
                offset_id
            }

        );

        // ساختار واقعی Rubika
        const data =
            response.data?.data;

        if (!data) {
            return;
        }

        const updates =
            data.updates || [];

        if (updates.length > 0) {

            console.log("");
            console.log(
                `📦 ${updates.length} آپدیت دریافت شد.`
            );
        }

        // پردازش تک‌تک آپدیت‌ها
        for (
            const update of updates
        ) {

            try {

                await processUpdate(
                    update
                );

            }
            catch (error) {

                console.error(
                    "❌ UPDATE PROCESS ERROR:",
                    error.message
                );
            }
        }

        // ==================================================
        // ذخیره OFFSET
        // ==================================================

        if (
            data.next_offset_id
        ) {

            offset_id =
                data.next_offset_id;

        }

    }
    catch (error) {

        console.error(
            "❌ FILE BOT UPDATE ERROR:",
            error.response?.data ||
            error.message
        );

    }
    finally {

        running = false;

    }
}

// ======================================================
// START BOT
// ======================================================

async function startBot() {

    console.log("");
    console.log(
        "========================================"
    );
    console.log(
        "🤖 RUBIKA FILE CHANNEL BOT"
    );
    console.log(
        "========================================"
    );

    if (!TOKEN) {

        console.log(
            "❌ File channel bot NOT started"
        );

        return;
    }

    console.log(
        "🔑 Token loaded"
    );

    // گرفتن اطلاعات ربات
    const botInfo =
        await getBotInfo();

    if (!botInfo) {

        console.log(
            "❌ اتصال ربات فایل کانال ناموفق بود"
        );

        return;
    }

    console.log(
        "✅ File channel bot connected"
    );

    console.log(
        "📡 Waiting for messages..."
    );

    console.log(
        "========================================"
    );

    // اولین بررسی
    await getUpdates();

    // بررسی پیام‌های جدید
    setInterval(
        getUpdates,
        5000
    );
}

// ======================================================
// EXPORT
// ======================================================

module.exports = {

    startBot,
    sendMessage,
    getBotInfo,
    getUpdates

};