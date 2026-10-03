const axios = require("axios");
const File = require("../models/File");



// =====================================================
// TOKEN
// =====================================================

const TOKEN =
    process.env.TELEGRAM_FILE_BOT_TOKEN;

if (!TOKEN) {

    console.error(
        "❌ TELEGRAM_FILE_BOT_TOKEN NOT FOUND"
    );

}


// =====================================================
// TELEGRAM API
// =====================================================

const TELEGRAM_URL =
    `https://api.telegram.org/bot${TOKEN}`;


const api = axios.create({

    timeout: 35000,

    headers: {
        "Content-Type": "application/json"
    }

});


// =====================================================
// OFFSET
// =====================================================

let offset = 0;

let running = false;

let botStarted = false;


// =====================================================
// COOLDOWN
// =====================================================

const cooldown = {};


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage(
    chat_id,
    text
) {

    try {

        const response =
            await api.post(

                `${TELEGRAM_URL}/sendMessage`,

                {
                    chat_id: String(chat_id),
                    text,
                    parse_mode: "HTML"
                }

            );


        console.log(
            "✅ TELEGRAM FILE MESSAGE SENT:",
            chat_id
        );


        return response.data;

    }
    catch (error) {

        console.error(
            "❌ TELEGRAM FILE SEND ERROR:",
            error.response?.data ||
            error.message
        );

        throw error;

    }

}


// =====================================================
// DETECT LESSON
// =====================================================

function detectLesson(
    fileName
) {

    const name =
        fileName
            .toLowerCase()
            .trim();


    const lessons = {


        // ریاضی

        "حسابان ۲": [
            "حسابان",
            "حسابان2",
            "حسابان ۲"
        ],


        "هندسه ۳": [
            "هندسه",
            "هندسه3",
            "هندسه ۳"
        ],


        "گسسته": [
            "گسسته",
            "ریاضی گسسته"
        ],


        // علوم

        "فیزیک ۳": [
            "فیزیک",
            "فیزیک3",
            "فیزیک ۳"
        ],


        "شیمی ۳": [
            "شیمی",
            "شیمی3",
            "شیمی ۳"
        ],


        // عمومی

        "فارسی ۳": [
            "فارسی",
            "ادبیات"
        ],


        "عربی ۳": [
            "عربی"
        ],


        "دین و زندگی ۳": [
            "دین",
            "زندگی",
            "دینی"
        ],


        "زبان انگلیسی ۳": [
            "زبان",
            "انگلیسی",
            "english"
        ],


        "سلامت و بهداشت": [
            "سلامت",
            "بهداشت"
        ],


        "هویت اجتماعی": [
            "هویت",
            "اجتماعی"
        ],


        // سایر

        "سایر": [
            "جزوه",
            "نمونه",
            "آزمون"
        ]

    };


    for (
        const lesson in lessons
    ) {

        for (
            const keyword
            of lessons[lesson]
        ) {

            if (
                name.includes(
                    keyword.toLowerCase()
                )
            ) {

                return lesson;

            }

        }

    }


    return "سایر";

}


// =====================================================
// START
// =====================================================

async function handleStart(
    chatId
) {

    if (
        cooldown[chatId] &&
        Date.now() -
        cooldown[chatId] <
        5000
    ) {

        return;

    }


    cooldown[chatId] =
        Date.now();


    await sendMessage(

        chatId,

`👋 سلام، خوش آمدید

📚 <b>Riseo File Bot</b>

━━━━━━━━━━━━━━━━

📎 فایل PDF خود را همینجا ارسال کنید.

ربات فایل را دریافت می‌کند و
به کتابخانه فایل‌های Riseo اضافه می‌کند.

━━━━━━━━━━━━━━━━

🆔 شناسه تلگرام شما:

<code>${chatId}</code>`

    );

}


// =====================================================
// HANDLE FILE
// =====================================================

async function handleFile(
    message
) {

    const chatId =
        message.chat?.id;


    const document =
        message.document;


    if (
        !chatId ||
        !document
    ) {

        return;

    }


    const fileName =
        document.file_name ||
        "بدون نام";


    const fileId =
        document.file_id;


    const fileSize =
        document.file_size ||
        0;


    console.log("");

    console.log(
        "╔══════════════════════════════════════╗"
    );

    console.log(
        "║       📁 TELEGRAM FILE DETECTED      ║"
    );

    console.log(
        "╚══════════════════════════════════════╝"
    );

    console.log("");


    console.log(
        "📄 NAME:",
        fileName
    );


    console.log(
        "🆔 FILE ID:",
        fileId
    );


    console.log(
        "📦 SIZE:",
        fileSize
    );


    console.log(
        "👤 CHAT:",
        chatId
    );


    // =================================================
    // فقط PDF
    // =================================================

    const isPDF =
        document.mime_type ===
        "application/pdf" ||
        fileName
            .toLowerCase()
            .endsWith(".pdf");


    if (!isPDF) {

        await sendMessage(

            chatId,

            "⚠️ فقط فایل‌های PDF قابل ثبت هستند."

        );

        return;

    }


    // =================================================
    // LESSON
    // =================================================

    const lesson =
        detectLesson(
            fileName
        );


    console.log(
        "📚 LESSON:",
        lesson
    );


    // =================================================
    // CHECK DUPLICATE
    // =================================================

    try {

        const existingFile =
            await File.findOne({

                fileId

            });


        if (existingFile) {

            console.log(
                "⚠️ FILE ALREADY EXISTS"
            );


            await sendMessage(

                chatId,

                `⚠️ این فایل قبلاً ثبت شده است.

📄 <b>${fileName}</b>

📚 درس: ${existingFile.lesson}`

            );

            return;

        }


        // =================================================
        // SAVE
        // =================================================

        const newFile =
            await File.create({

                name:
                    fileName,

                lesson:
                    lesson,

                fileId:
                    fileId,

                fileType:
                    "pdf",

                size:
                    fileSize,

                source:
                    "telegram",

                chatId:
                    String(chatId)

            });


        console.log("");

        console.log(
            "✅ TELEGRAM FILE SAVED"
        );

        console.log(
            "🗄️ DATABASE ID:",
            newFile._id
        );


        // =================================================
        // SUCCESS MESSAGE
        // =================================================

        await sendMessage(

            chatId,

`✅ <b>فایل با موفقیت ثبت شد</b>

━━━━━━━━━━━━━━━━

📄 <b>نام:</b>
${fileName}

📚 <b>درس:</b>
${lesson}

📦 <b>حجم:</b>
${fileSize} bytes

━━━━━━━━━━━━━━━━

📚 فایل به کتابخانه Riseo اضافه شد.`

        );

    }
    catch (error) {

        console.error("");

        console.error(
            "❌ TELEGRAM FILE DATABASE ERROR:"
        );

        console.error(
            error.message
        );


        await sendMessage(

            chatId,

            "❌ هنگام ثبت فایل خطایی رخ داد."

        );

    }

}


// =====================================================
// HANDLE MESSAGE
// =====================================================

async function handleMessage(
    message
) {

    if (!message) {

        return;

    }


    const chatId =
        message.chat?.id;


    const text =
        message.text ||
        "";


    if (!chatId) {

        return;

    }


    console.log(
        "📩 TELEGRAM FILE MESSAGE:",
        text ||
        "(بدون متن)",
        "CHAT:",
        chatId
    );


    // =================================================
    // START
    // =================================================

    if (
        text === "/start"
    ) {

        await handleStart(
            chatId
        );

        return;

    }


    // =================================================
    // DOCUMENT
    // =================================================

    if (
        message.document
    ) {

        await handleFile(
            message
        );

        return;

    }

}


// =====================================================
// GET UPDATES
// =====================================================

async function getMessages() {

    if (running) {

        return;

    }


    if (!TOKEN) {

        console.error(
            "❌ Telegram File Bot cannot start: TOKEN missing"
        );

        return;

    }


    running = true;


    try {

        const response =
            await api.get(

                `${TELEGRAM_URL}/getUpdates`,

                {

                    params: {

                        offset,

                        timeout: 30

                    }

                }

            );


        if (
            !response.data?.ok
        ) {

            console.error(
                "❌ TELEGRAM FILE API ERROR:",
                response.data
            );

            return;

        }


        const updates =
            response.data.result ||
            [];


        for (
            const update
            of updates
        ) {

            offset =
                update.update_id + 1;


            try {

                if (
                    update.message
                ) {

                    await handleMessage(
                        update.message
                    );

                }

            }
            catch (error) {

                console.error(
                    "❌ TELEGRAM FILE UPDATE ERROR:",
                    error.response?.data ||
                    error.message
                );

            }

        }

    }
    catch (error) {

        console.error(
            "❌ TELEGRAM FILE POLLING ERROR:",
            error.response?.data ||
            error.message
        );

    }
    finally {

        running = false;

    }

}


// =====================================================
// START BOT
// =====================================================

function startBot() {

    if (botStarted) {

        console.log(
            "⚠️ Telegram File Bot is already running."
        );

        return;

    }


    botStarted = true;


    console.log("");

    console.log(
        "================================"
    );

    console.log(
        "📁 TELEGRAM FILE BOT"
    );

    console.log(
        "================================"
    );


    if (!TOKEN) {

        console.error(
            "❌ TELEGRAM_FILE_BOT_TOKEN NOT FOUND"
        );

        return;

    }


    console.log(
        "🔑 Telegram File Bot token loaded"
    );


    console.log(
        "📡 Waiting for Telegram files..."
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


module.exports = {

    startBot,
    sendMessage

};