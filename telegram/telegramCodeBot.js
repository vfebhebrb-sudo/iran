const axios = require("axios");


// ==================================================
// TOKEN
// ==================================================

const TOKEN = process.env.TELEGRAM_CODE_BOT_TOKEN;

if (!TOKEN) {
    console.error("❌ TELEGRAM_CODE_BOT_TOKEN NOT FOUND");
}


// ==================================================
// TELEGRAM API
// ==================================================

const TELEGRAM_URL =
    `https://api.telegram.org/bot${TOKEN}`;

const api = axios.create({
    timeout: 15000,
    headers: {
        "Content-Type": "application/json"
    }
});


// ==================================================
// OTP STORAGE
// ==================================================

const otpCodes = {};


// ==================================================
// POLLING
// ==================================================

let offset = 0;
let running = false;
let botStarted = false;


// ==================================================
// SEND MESSAGE
// ==================================================

async function sendMessage(
    chat_id,
    text,
    keyboard = null
) {

    try {

        const body = {
            chat_id: String(chat_id),
            text,
            parse_mode: "HTML"
        };


        if (keyboard) {

            body.reply_markup = {
                inline_keyboard: keyboard
            };

        }


        const res = await api.post(
            `${TELEGRAM_URL}/sendMessage`,
            body
        );


        console.log(
            "✅ TELEGRAM MESSAGE SENT:",
            chat_id
        );


        return res.data;

    }
    catch (error) {

        console.error(
            "❌ TELEGRAM SEND ERROR:",
            error.response?.data ||
            error.message
        );


        throw error;

    }

}


// ==================================================
// CHAT ID KEYBOARD
// ==================================================

function chatIdKeyboard() {

    return [

        [

            {
                text: "📋 کپی شناسه تلگرام",
                callback_data: "copy_chat_id"
            }

        ]

    ];

}


// ==================================================
// OTP KEYBOARD
// ==================================================

function otpKeyboard() {

    return [

        [

            {
                text: "📋 دریافت کد تأیید",
                callback_data: "copy_otp"
            }

        ]

    ];

}


// ==================================================
// SEND OTP
// ==================================================

async function sendOTP(
    chat_id,
    code
) {

    console.log(
        "🔐 TELEGRAM OTP REQUEST:",
        chat_id,
        code
    );


    // ذخیره OTP
    otpCodes[String(chat_id)] = {

        code: String(code),

        createdAt: Date.now()

    };


    const text =

`🔐 <b>کد تأیید حساب</b>

━━━━━━━━━━━━━━━━

<b>${code}</b>

━━━━━━━━━━━━━━━━

⏳ اعتبار کد: ۲ دقیقه

⚠️ این کد را فقط در سایت وارد کنید.

🤖 سامانه برنامه‌ریزی کنکور`;


    try {

        const result = await sendMessage(

            chat_id,

            text,

            otpKeyboard()

        );


        console.log(
            "✅ TELEGRAM OTP SENT:",
            chat_id
        );


        return result;

    }
    catch (error) {

        // اگر ارسال شکست خورد
        // OTP قبلی را نگه نمی‌داریم

        delete otpCodes[String(chat_id)];


        console.error(
            "❌ TELEGRAM OTP FAILED:",
            error.response?.data ||
            error.message
        );


        throw error;

    }

}


// ==================================================
// HANDLE CALLBACK
// ==================================================

async function handleCallback(
    callbackQuery
) {

    const query =
        callbackQuery;

    const chat =
        query.message?.chat?.id;

    const data =
        query.data;


    if (!chat) {
        return;
    }


    console.log(
        "🔘 TELEGRAM BUTTON:",
        data,
        "CHAT:",
        chat
    );


    // ==============================================
    // COPY CHAT ID
    // ==============================================

    if (data === "copy_chat_id") {

        await sendMessage(

            chat,

`📋 <b>شناسه تلگرام شما:</b>

<code>${chat}</code>

━━━━━━━━━━━━━━━━

این شناسه را در سایت وارد کنید.`

        );


        return;

    }


    // ==============================================
    // COPY OTP
    // ==============================================

    if (data === "copy_otp") {

        const key =
            String(chat);

        const otp =
            otpCodes[key];


        if (!otp) {

            await sendMessage(

                chat,

                "⚠️ کد تأیید پیدا نشد.\nلطفاً دوباره درخواست کنید."

            );

            return;

        }


        const expired =

            Date.now() -
            otp.createdAt >
            2 * 60 * 1000;


        if (expired) {

            delete otpCodes[key];


            await sendMessage(

                chat,

                "⏳ کد تأیید منقضی شده است."

            );


            return;

        }


        await sendMessage(

            chat,

`📋 <b>کد تأیید شما:</b>

<code>${otp.code}</code>

━━━━━━━━━━━━━━━━

کد را در سایت وارد کنید.`

        );


        return;

    }

}


// ==================================================
// HANDLE MESSAGE
// ==================================================

async function handleMessage(
    message
) {

    if (!message) {
        return;
    }


    const chat =
        message.chat?.id;

    const text =
        message.text || "";


    if (!chat) {
        return;
    }


    console.log(
        "📩 TELEGRAM MESSAGE:",
        text,
        "CHAT:",
        chat
    );


    // ==============================================
    // START
    // ==============================================

    if (text === "/start") {

        await sendMessage(

            chat,

`👋 سلام، خوش آمدید

🎓 <b>سامانه برنامه‌ریزی کنکور</b>

━━━━━━━━━━━━━━━━

🆔 <b>شناسه تلگرام شما:</b>

<code>${chat}</code>

━━━━━━━━━━━━━━━━

برای ثبت‌نام در سایت،
این شناسه را وارد کنید.

📋 می‌توانید از دکمه زیر
برای دریافت شناسه استفاده کنید.`,

            chatIdKeyboard()

        );


        return;

    }

}


// ==================================================
// GET UPDATES
// ==================================================

async function getMessages() {

    if (running) {
        return;
    }


    if (!TOKEN) {
        console.error(
            "❌ Telegram bot cannot start: TOKEN missing"
        );

        return;
    }


    running = true;


    try {

        const res = await api.get(

            `${TELEGRAM_URL}/getUpdates`,

            {
                params: {

                    offset,

                    timeout: 30

                }

            }

        );


        if (!res.data?.ok) {

            console.error(
                "❌ TELEGRAM API ERROR:",
                res.data
            );

            return;

        }


        const updates =
            res.data.result || [];


        for (const update of updates) {

            // خیلی مهم:
            // قبل از پردازش update، offset جلو می‌رود

            offset =
                update.update_id + 1;


            try {

                // ==================================
                // CALLBACK
                // ==================================

                if (update.callback_query) {

                    await handleCallback(
                        update.callback_query
                    );

                    continue;

                }


                // ==================================
                // MESSAGE
                // ==================================

                if (update.message) {

                    await handleMessage(
                        update.message
                    );

                    continue;

                }

            }
            catch (error) {

                console.error(
                    "❌ TELEGRAM UPDATE ERROR:",
                    error.response?.data ||
                    error.message
                );

            }

        }

    }
    catch (error) {

        console.error(

            "❌ TELEGRAM POLLING ERROR:",

            error.response?.data ||
            error.message

        );

    }
    finally {

        running = false;

    }

}


// ==================================================
// START BOT
// ==================================================

function startBot() {

    if (botStarted) {

        console.log(
            "⚠️ Telegram Code Bot is already running."
        );

        return;

    }


    botStarted = true;


    console.log("");
    console.log("================================");
    console.log("🤖 TELEGRAM CODE BOT");
    console.log("================================");


    if (!TOKEN) {

        console.error(
            "❌ TELEGRAM_CODE_BOT_TOKEN NOT FOUND"
        );

        return;

    }


    console.log(
        "🔑 Telegram token loaded"
    );


    console.log(
        "📡 Waiting for Telegram messages..."
    );


    console.log(
        "================================"
    );


    getMessages();


    setInterval(

        getMessages,

        3000

    );

}


// ==================================================
// EXPORT
// ==================================================

module.exports = {

    startBot,

    sendMessage,

    sendOTP

};