const axios = require("axios");
const fs = require("fs");
const path = require("path");


// ===============================
// TOKEN
// ===============================

const TOKEN = process.env.RUBIKA_TOKEN;


// ===============================
// AXIOS CONFIG
// ===============================

const api = axios.create({

    timeout: 15000,

    headers: {
        "Content-Type": "application/json"
    }

});


// ===============================
// OFFSET
// ===============================

const offsetFile = path.join(
    __dirname,
    "offset.json"
);

let offset_id = null;


if (fs.existsSync(offsetFile)) {

    try {

        const data =
            JSON.parse(
                fs.readFileSync(
                    offsetFile,
                    "utf8"
                )
            );

        offset_id =
            data.offset_id || null;

    }
    catch {

        offset_id = null;

    }

}


function saveOffset() {

    fs.writeFileSync(

        offsetFile,

        JSON.stringify({
            offset_id
        })

    );

}


// ===============================
// OTP STORAGE
// ===============================
//
// کد OTP هر کاربر موقتاً اینجا نگهداری می‌شود
// تا وقتی روی دکمه «کپی کد» بزند.
// ===============================

const otpCodes = {};


// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage(
    chat_id,
    text,
    inline_keypad = null
) {

    try {

        const body = {

            chat_id,

            text

        };


        // اگر دکمه شیشه‌ای وجود داشت
        if (inline_keypad) {

            body.inline_keypad =
                inline_keypad;

        }


        const res =
            await api.post(

                `https://botapi.rubika.ir/v3/${TOKEN}/sendMessage`,

                body

            );


        console.log(
            "MESSAGE SENT:",
            chat_id
        );


        return res.data;

    }
    catch (error) {

        console.log(

            "SEND ERROR:",

            error.response?.data ||
            error.message

        );

    }

}


// ===============================
// INLINE KEYBOARD
// ===============================


// دکمه کپی شناسه روبیکا
function chatIdKeyboard() {

    return {

        rows: [

            {

                buttons: [

                    {

                        id: "copy_chat_id",

                        type: "Simple",

                        button_text:
                            "📋 کپی شناسه روبیکا"

                    }

                ]

            }

        ]

    };

}


// دکمه کپی کد OTP
function otpKeyboard() {

    return {

        rows: [

            {

                buttons: [

                    {

                        id: "copy_otp",

                        type: "Simple",

                        button_text:
                            "📋 کپی کد تأیید"

                    }

                ]

            }

        ]

    };

}


// ===============================
// SEND OTP
// ===============================

async function sendOTP(
    chat_id,
    code
) {

    // ذخیره کد برای این کاربر
    otpCodes[chat_id] = {

        code: String(code),

        createdAt: Date.now()

    };


    const text =

`🔐 کد تأیید حساب

━━━━━━━━━━━━━━━━

        ${code}

━━━━━━━━━━━━━━━━

⏳ اعتبار کد: ۲ دقیقه

⚠️ این کد را فقط در سایت وارد کنید.

اگر شما درخواست نداده‌اید،
این پیام را نادیده بگیرید.

🤖 سامانه برنامه‌ریزی کنکور`;


    return sendMessage(

        chat_id,

        text,

        otpKeyboard()

    );

}


// ===============================
// UPDATE LOOP
// ===============================

let running = false;


const cooldown = {};


// ===============================
// GET MESSAGES
// ===============================

async function getMessages() {

    if (running)
        return;


    running = true;


    try {

        const res =
            await api.post(

                `https://botapi.rubika.ir/v3/${TOKEN}/getUpdates`,

                {
                    offset_id
                }

            );


        const data =
            res.data?.data;


        if (!data)
            return;


        const updates =
            data.updates || [];


        for (const update of updates) {


            // فقط پیام‌های جدید
            if (
                update.type !== "NewMessage"
            )
                continue;


            const message =
                update.new_message;


            if (!message)
                continue;


            const text =
                message.text || "";


            const chat =
                message.chat_id ||
                update.chat_id;


            // ==========================================
            // BUTTON CLICK
            // ==========================================
            //
            // کلیک دکمه‌های شیشه‌ای در aux_data قرار دارد.
            //
            // ==========================================

            const buttonId =
                message.aux_data?.button_id;


            if (buttonId) {


                console.log(
                    "BUTTON CLICK:",
                    buttonId,
                    "CHAT:",
                    chat
                );


                // ======================================
                // COPY CHAT ID
                // ======================================

                if (
                    buttonId === "copy_chat_id"
                ) {

                    await sendMessage(

                        chat,

`📋 شناسه روبیکای شما:

${chat}

━━━━━━━━━━━━━━━━

👆 شناسه بالا را کپی کنید
و در سایت وارد کنید.`

                    );


                    continue;

                }


                // ======================================
                // COPY OTP
                // ======================================

                if (
                    buttonId === "copy_otp"
                ) {


                    const otp =
                        otpCodes[chat];


                    // اگر کد وجود نداشت
                    if (!otp) {

                        await sendMessage(

                            chat,

`⚠️ کد تأیید پیدا نشد.

لطفاً دوباره درخواست ارسال
کد تأیید کنید.`

                        );


                        continue;

                    }


                    // بررسی اعتبار ۲ دقیقه‌ای
                    const expired =
                        Date.now() -
                        otp.createdAt >
                        2 * 60 * 1000;


                    if (expired) {

                        delete otpCodes[chat];


                        await sendMessage(

                            chat,

`⏳ این کد منقضی شده است.

لطفاً یک کد تأیید جدید
درخواست کنید.`

                        );


                        continue;

                    }


                    await sendMessage(

                        chat,

`📋 کد تأیید شما:

${otp.code}

━━━━━━━━━━━━━━━━

👆 کد بالا را کپی کنید
و در سایت وارد کنید.`

                    );


                    continue;

                }


                // اگر دکمه ناشناخته بود
                console.log(
                    "UNKNOWN BUTTON:",
                    buttonId
                );


                continue;

            }


            // ==========================================
            // LOG MESSAGE
            // ==========================================

            console.log(
                "MESSAGE:",
                text
            );


            // ==========================================
            // START
            // ==========================================

            if (text === "/start") {


                if (
                    cooldown[chat] &&
                    Date.now() -
                    cooldown[chat] < 5000
                ) {

                    continue;

                }


                cooldown[chat] =
                    Date.now();


                const startText =

`👋 سلام، خوش آمدید

🎓 سامانه برنامه‌ریزی کنکور

━━━━━━━━━━━━━━━━

✨ امکانات سامانه:

📚 برنامه‌ریزی مطالعه

⏱ مدیریت زمان و تایمر

📝 ثبت آزمون و تحلیل

📊 گزارش پیشرفت

━━━━━━━━━━━━━━━━

🆔 شناسه روبیکای شما:

${chat}

━━━━━━━━━━━━━━━━

🔹 برای ثبت‌نام در سایت،
شناسه بالا را وارد کنید.

📋 همچنین می‌توانید از دکمه
زیر برای دریافت شناسه استفاده کنید.

━━━━━━━━━━━━━━━━

🚀 موفقیت با برنامه‌ریزی شروع می‌شود.`;


                await sendMessage(

                    chat,

                    startText,

                    chatIdKeyboard()

                );


                continue;

            }


            // ==========================================
            // HELLO
            // ==========================================

            if (text === "سلام") {


                await sendMessage(

                    chat,

`👋 سلام!

🤖 ربات با موفقیت فعال است.

━━━━━━━━━━━━━━━━

🆔 شناسه شما:

${chat}

━━━━━━━━━━━━━━━━

برای دریافت شناسه،
روی دکمه زیر بزنید.`,

                    chatIdKeyboard()

                );


                continue;

            }

        }


        // ==========================================
        // UPDATE OFFSET
        // ==========================================

        if (data.next_offset_id) {

            offset_id =
                data.next_offset_id;

            saveOffset();

        }

    }
    catch (error) {

        console.log(

            "BOT ERROR:",

            error.response?.data ||
            error.message

        );


        await new Promise(

            r =>
                setTimeout(
                    r,
                    5000
                )

        );

    }
    finally {

        running = false;

    }

}


// ===============================
// START BOT
// ===============================

function startBot() {

    console.log(
        "Rubika bot started"
    );


    getMessages();


    setInterval(

        getMessages,

        10000

    );

}


// ===============================
// EXPORTS
// ===============================

module.exports = {

    startBot,

    sendMessage,

    sendOTP

};
