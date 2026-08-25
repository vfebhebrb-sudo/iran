// ======================================================
// TELEGRAM BOT
// ======================================================

const TelegramBot = require("node-telegram-bot-api");



// ======================================================
// TOKEN
// ======================================================

const TOKEN = process.env.TELEGRAM_TOKEN;



let bot = null;



// ======================================================
// SEND MESSAGE
// ======================================================

async function sendMessage(chat_id,text){


    try{


        return await bot.sendMessage(
            chat_id,
            text
        );


    }
    catch(error){


        console.log(
            "TELEGRAM SEND ERROR:",
            error.message
        );


    }

}



// ======================================================
// SEND OTP
// ======================================================


async function sendOTP(chat_id,code){


const text =

`🔐 کد تایید حساب


━━━━━━━━━━━━━━

        ${code}

━━━━━━━━━━━━━━


⏳ اعتبار کد: ۲ دقیقه


⚠️ این کد را فقط در سایت وارد کنید.

اگر شما درخواست نداده‌اید،
این پیام را نادیده بگیرید.

🤖 سامانه برنامه‌ریزی کنکور`;



return sendMessage(
    chat_id,
    text
);


}



// ======================================================
// START BOT
// ======================================================


function startBot(){


    if(!TOKEN){


        console.log(
            "Telegram token missing ❌"
        );


        return;


    }




    bot = new TelegramBot(
        TOKEN,
        {
            polling:true
        }
    );




    console.log(
        "Telegram bot started"
    );




    // ===============================
    // START COMMAND
    // ===============================


    bot.onText(
        /\/start/,
        async(msg)=>{


            const chat =
            msg.chat.id;



            await sendMessage(

                chat,

`👋 سلام، خوش آمدید


🎓 سامانه برنامه‌ریزی کنکور


━━━━━━━━━━━━━━


✨ امکانات سامانه:


📚 برنامه‌ریزی مطالعه

⏱ مدیریت زمان و تایمر

📝 ثبت آزمون و تحلیل

📊 گزارش پیشرفت


━━━━━━━━━━━━━━


🤖 شناسه تلگرام شما:


📋

${chat}


👆 این عدد را نگه دارید و
در صفحه ثبت‌نام سایت وارد کنید.


━━━━━━━━━━━━━━


🚀 موفقیت با برنامه‌ریزی شروع می‌شود.`

            );


        }

    );





    // ===============================
    // TEXT MESSAGE
    // ===============================


    bot.on(
        "message",
        async(msg)=>{


            if(!msg.text)
                return;



            if(
                msg.text === "سلام"
            ){


                await sendMessage(

                    msg.chat.id,


`سلام 👋

ربات فعال است ✅

شناسه شما:

${msg.chat.id}`

                );


            }


        }

    );




bot.on(
    "polling_error",
    (error)=>{


        console.log(
            "Telegram polling error:",
            error.message
        );


        console.log(
            error
        );


    }
);



}





module.exports={

    startBot,

    sendMessage,

    sendOTP

};