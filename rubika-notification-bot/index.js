
const axios = require("axios");

// ======================================================
// TOKEN
// ======================================================

const TOKEN =
    process.env.RUBIKA_NOTIFICATION_BOT_TOKEN;

if (!TOKEN) {
    console.error(
        "❌ RUBIKA_NOTIFICATION_BOT_TOKEN پیدا نشد!"
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

// ======================================================
// SEND MESSAGE
// ======================================================

async function sendMessage(chatId, text) {

    if (!TOKEN) {
        throw new Error(
            "توکن ربات اعلان روبیکا وجود ندارد."
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
            "║       📤 RUBIKA SEND MESSAGE         ║"
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

        console.log(
            "📡 ارسال به Rubika API..."
        );


        const response = await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/sendMessage`,

            payload

        );


        const data =
            response.data;


        console.log(
            "📡 RUBIKA HTTP STATUS:",
            response.status
        );

        console.log(
            "📦 RUBIKA RESPONSE:"
        );

        console.log(
            JSON.stringify(
                data,
                null,
                2
            )
        );


        // ==================================================
        // فقط OK موفق است
        // ==================================================

        if (
            !data ||
            data.status !== "OK"
        ) {

            const errorMessage =
                data?.message ||
                data?.error ||
                `Rubika API status: ${data?.status || "UNKNOWN"}`;


            console.error(
                "❌ RUBIKA REJECTED MESSAGE:",
                errorMessage
            );


            throw new Error(
                errorMessage
            );
        }


        // ==================================================
        // SUCCESS
        // ==================================================

        console.log(
            "✅ RUBIKA ACCEPTED MESSAGE"
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
            "║       ❌ RUBIKA SEND FAILED          ║"
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
            "║       🔔 NOTIF SHEKAN BOT INFO       ║"
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

    // فقط پیام جدید
    if (update.type !== "NewMessage") {
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
        "║      🔔 NOTIF SHEKAN MESSAGE         ║"
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

    console.log("");

    if (!chatId) {
        console.log(
            "⚠️ chatId پیدا نشد."
        );
        return;
    }

    // ==================================================
    // START
    // ==================================================

    if (text.trim() === "/start") {

        await sendMessage(

            chatId,

`🔔 نوفیت‌شکن بات فعال شد!

سلام 👋

ربات اعلان سامانه برنامه‌ریزی کنکور با موفقیت به شما متصل شد.

━━━━━━━━━━━━━━

🆔 شناسه روبیکای شما:

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

    if (text.trim() === "سلام") {

        await sendMessage(

            chatId,

`سلام 👋

🔔 نوفیت‌شکن بات فعاله!

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

        const response = await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/getUpdates`,

            {
                offset_id
            }

        );

        const data =
            response.data?.data;

        if (!data) {
            return;
        }

        const updates =
            data.updates || [];

        if (updates.length > 0) {

            console.log(
                `📦 ${updates.length} update دریافت شد.`
            );

        }

        for (const update of updates) {

            try {

                await processUpdate(update);

            }
            catch (error) {

                console.error(
                    "❌ UPDATE PROCESS ERROR:",
                    error.message
                );

            }
        }

        // ==================================================
        // SAVE OFFSET
        // ==================================================

        if (data.next_offset_id) {

            offset_id =
                data.next_offset_id;

        }

    }
    catch (error) {

        console.error(
            "❌ NOTIFICATION BOT UPDATE ERROR:",
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
        "🔔 NOTIF SHEKAN BOT"
    );
    console.log(
        "========================================"
    );

    if (!TOKEN) {

        console.log(
            "❌ Notification bot NOT started"
        );

        console.log(
            "========================================"
        );

        return;
    }

    console.log(
        "🔑 Token loaded"
    );

    const botInfo =
        await getBotInfo();

    if (!botInfo) {

        console.log(
            "❌ Notification bot connection failed"
        );

        console.log(
            "========================================"
        );

        return;
    }

    console.log(
        "✅ Notification bot connected"
    );

    console.log(
        "📡 Waiting for messages..."
    );

    console.log(
        "========================================"
    );

    console.log("");

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

