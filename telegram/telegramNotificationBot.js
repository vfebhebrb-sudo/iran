const axios = require("axios");

// ======================================================
// TOKEN
// ======================================================

const TOKEN =
    process.env.TELEGRAM_NOTIFICATION_BOT_TOKEN;

if (!TOKEN) {

    console.error(
        "❌ TELEGRAM_NOTIFICATION_BOT_TOKEN پیدا نشد!"
    );

}


// ======================================================
// API
// ======================================================

const api = axios.create({

    baseURL:
        `https://api.telegram.org/bot${TOKEN}`,

    timeout: 15000

});


// ======================================================
// OFFSET
// ======================================================

let offset = 0;


// ======================================================
// SEND MESSAGE
// ======================================================

async function sendMessage(chatId, text) {

    if (!TOKEN) {

        throw new Error(
            "توکن ربات اعلان تلگرام وجود ندارد."
        );

    }

    if (!chatId) {

        throw new Error(
            "Chat ID تلگرام وجود ندارد."
        );

    }


    const payload = {

        chat_id: String(chatId).trim(),

        text: String(text)

    };


    console.log("");

    console.log(
        "╔══════════════════════════════════════╗"
    );

    console.log(
        "║      📤 TELEGRAM SEND MESSAGE       ║"
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


    try {

        const response = await api.post(

            "/sendMessage",

            payload

        );


        const data =
            response.data;


        console.log(
            "📡 TELEGRAM HTTP STATUS:",
            response.status
        );


        console.log(
            "📦 TELEGRAM RESPONSE:"
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
            data.ok !== true
        ) {

            throw new Error(
                data?.description ||
                "Telegram پیام را قبول نکرد."
            );

        }


        console.log(
            "✅ TELEGRAM MESSAGE SENT"
        );


        console.log(
            "🆔 MESSAGE ID:",
            data.result?.message_id || "N/A"
        );


        return data;

    }
    catch (error) {

        console.error("");

        console.error(
            "╔══════════════════════════════════════╗"
        );

        console.error(
            "║       ❌ TELEGRAM SEND FAILED       ║"
        );

        console.error(
            "╚══════════════════════════════════════╝"
        );


        console.error(
            "HTTP STATUS:",
            error.response?.status || "N/A"
        );


        console.error(
            "TELEGRAM RESPONSE:",

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


        throw error;

    }

}


// ======================================================
// GET BOT INFO
// ======================================================

async function getBotInfo() {

    if (!TOKEN) {

        return null;

    }


    try {

        const response = await api.post(
            "/getMe"
        );


        console.log("");

        console.log(
            "╔══════════════════════════════════════╗"
        );

        console.log(
            "║      🔔 TELEGRAM NOTIF BOT INFO     ║"
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
            "❌ TELEGRAM GET BOT INFO ERROR:",

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


    const message =
        update.message;


    if (!message) {

        return;

    }


    const text =
        message.text || "";


    const chatId =
        message.chat?.id;


    console.log("");

    console.log(
        "╔══════════════════════════════════════╗"
    );

    console.log(
        "║      🔔 TELEGRAM NOTIF MESSAGE      ║"
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


    if (!chatId) {

        console.log(
            "⚠️ Chat ID پیدا نشد."
        );

        return;

    }


    // ==================================================
    // START
    // ==================================================

    if (
        text.trim() === "/start"
    ) {

        await sendMessage(

            chatId,

`🔔 ربات اعلان Riseo فعال شد!

سلام 👋

این ربات برای ارسال اعلان‌های سامانه Riseo استفاده می‌شود.

━━━━━━━━━━━━━━

🆔 شناسه تلگرام شما:

${chatId}

━━━━━━━━━━━━━━

⏰ از این شناسه برای ارسال اعلان‌های برنامه استفاده خواهد شد.

✅ اتصال با موفقیت انجام شد.`

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

🔔 ربات اعلان Riseo فعاله!

🆔 شناسه شما:

${chatId}`

        );

        return;

    }

}


// ======================================================
// GET UPDATES
// ======================================================

let running = false;


async function getUpdates() {

    if (running) {

        return;

    }


    if (!TOKEN) {

        return;

    }


    running = true;


    try {

        const response =
            await api.get(
                "/getUpdates",
                {
                    params: {

                        offset,

                        timeout: 5

                    }

                }
            );


        const data =
            response.data;


        if (
            !data ||
            data.ok !== true
        ) {

            return;

        }


        const updates =
            data.result || [];


        if (
            updates.length > 0
        ) {

            console.log(
                `📦 ${updates.length} Telegram update دریافت شد.`
            );

        }


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
                    "❌ TELEGRAM UPDATE PROCESS ERROR:",
                    error.message
                );

            }


            offset =
                update.update_id + 1;

        }

    }
    catch (error) {

        console.error(
            "❌ TELEGRAM NOTIFICATION UPDATE ERROR:",

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
        "🔔 TELEGRAM NOTIFICATION BOT"
    );

    console.log(
        "========================================"
    );


    if (!TOKEN) {

        console.log(
            "❌ Telegram notification bot NOT started"
        );

        return;

    }


    console.log(
        "🔑 Telegram notification token loaded"
    );


    const botInfo =
        await getBotInfo();


    if (
        !botInfo ||
        botInfo.ok !== true
    ) {

        console.log(
            "❌ Telegram notification bot connection failed"
        );

        return;

    }


    console.log(
        "✅ Telegram notification bot connected"
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