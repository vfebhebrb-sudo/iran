// ======================================================
// TELEGRAM SMART ROBO BOT
// ======================================================


const TelegramBot = require("node-telegram-bot-api");

const fs = require("fs");

const path = require("path");

const askGemini =
require("../ai/gemini");



const {
    saveMemory,
    getMemory,
    getUserName

} =
require("../services/roboMemoryService");

const {
getSiteContext
}
=
require("../services/siteBrainService");

console.log(
"🔥 TELEGRAM ROBO BOT LOADED"
);



const TOKEN =
process.env.TELEGRAM_TOKEN;



let bot = null;



const FILE_DIR =
path.join(
    __dirname,
    "../temp-files"
);




// ======================================================
// FILE SYSTEM
// ======================================================


function getFiles(){


    if(!fs.existsSync(FILE_DIR)){

        return [];

    }



    return fs
    .readdirSync(FILE_DIR)
    .filter(
        x=>!x.startsWith(".")
    );


}





// ======================================================
// SEND
// ======================================================


async function send(chat,text){


    try{


        const result =
        await bot.sendMessage(
            chat,
            text
        );


        console.log(
            "✅ SENT:",
            result.message_id
        );


    }
    catch(error){


        console.log(
            "SEND ERROR:",
            error.message
        );


    }


}




// ======================================================
// CHECK ROBO CALL
// ======================================================


function isRoboCalled(text){


    const value =
    text
    .toLowerCase();



    return (

        value.includes("روبو")

        ||

        value.includes("robo")

    );


}




// ======================================================
// REMOVE ROBO WORD
// ======================================================


function cleanMessage(text){


    return text
    .replace(/روبو/gi,"")
    .trim();


}




// ======================================================
// EXTRACT USER NAME
// ======================================================


function extractName(text){


    const patterns = [


        /اسم من (.+)/,

        /منو (.+) صدا کن/,

        /اسمم (.+) هست/,

        /اسمم (.+) است/


    ];



    for(
        const regex of patterns
    ){


        const match =
        text.match(regex);



        if(match){


            return match[1]
            .trim();


        }


    }



    return null;


}






// ======================================================
// BUILD MEMORY CONTEXT
// ======================================================

async function buildContext(chatId,userId){


    const memories =
    await getMemory(
        chatId,
        userId
    );



    let context = "";



    if(memories.length){


        memories
        .forEach(item=>{


            context += `

کاربر:
${item.message}


روبو:
${item.answer || ""}


`;

        });


    }




    const name =
    await getUserName(
        chatId,
        userId
    );




    return `


تو روبو هستی.


نام کاربر:
${name || "نامشخص"}



تاریخچه گفتگو:


${context}


`;

}


// ======================================================
// START BOT
// ======================================================


function startBot(){



if(!TOKEN){


console.log(
"❌ TELEGRAM TOKEN MISSING"
);


return;


}





bot =
new TelegramBot(

    TOKEN,

    {
        polling:true
    }

);





console.log(
"🤖 ROBO STARTED"
);





bot.getMe()
.then(me=>{


console.log(
"CONNECTED:",
me.username
);


});





// ادامه در بخش ۲...

// ======================================================
// MESSAGE HANDLER
// ======================================================


bot.on(
"message",
async(msg)=>{


    try{


        if(!msg.text)
            return;



        const text =
        msg.text.trim();


        const chatId =
String(msg.chat.id);


const userId =
String(msg.from.id);


const username =
msg.from.username || null;



        console.log(
            "📩 MESSAGE:",
            text
        );



        // ==========================================
        // دستورات فایل مستقل هستند
        // ==========================================


        if(text === "لیست فایل ها"){


            const files =
            getFiles();



            if(files.length===0){


                return send(
                    msg.chat.id,
                    "❌ فایلی وجود ندارد"
                );


            }



            let result =
            "📁 فایل‌ها:\n\n";



            files.forEach(
                (file,index)=>{


                    result +=
                    `${index+1}️⃣ ${file}\n`;


                }
            );



            return send(
                msg.chat.id,
                result
            );


        }





        // ==========================================
        // دریافت فایل
        // ==========================================


        const fileMatch =
        text.match(
            /دریافت\s+(\d+)/
        );



        if(fileMatch){


            const index =
            Number(fileMatch[1])-1;



            const files =
            getFiles();



            const file =
            files[index];



            if(!file){


                return send(
                    msg.chat.id,
                    "❌ فایل پیدا نشد"
                );


            }



            return bot.sendDocument(

                msg.chat.id,

                path.join(
                    FILE_DIR,
                    file
                )

            );


        }







        // ==========================================
        // فقط وقتی روبو صدا زده شد
        // ==========================================


        if(!isRoboCalled(text)){


            return;


        }




        const cleanText =
        cleanMessage(text);

        if(!cleanText){

    return send(
        msg.chat.id,
        "بله؟ گوشم با توئه 👋"
    );

}

        // ==========================================
// STATIC ROBO COMMANDS
// ==========================================


const lowerText =
cleanText.toLowerCase();



// لینک سایت

if(
    lowerText.includes("لینک سایت") ||
    lowerText.includes("آدرس سایت") ||
    lowerText.includes("سایت رو بده")
){


    return send(

        msg.chat.id,

`🌐 لینک سایت:

https://vfebhebrb-sudo.github.io/Riseo/


هر وقت خواستی بگو:
«روبو لینک سایت رو بده»`

    );


}




        console.log(
            "🤖 ROBO REQUEST:",
            cleanText
        );





        // ==========================================
        // تشخیص اسم
        // ==========================================


        const detectedName =
        extractName(cleanText);




        let userName = null;



        if(detectedName){


            userName =
            detectedName;



            console.log(
                "🧠 NEW NAME:",
                userName
            );


        }





        // ==========================================
        // وضعیت فکر کردن
        // ==========================================


        await send(

            msg.chat.id,

            "⏳ دارم فکر می‌کنم..."

        );






        // ==========================================
        // گرفتن حافظه
        // ==========================================


            const context =
            await buildContext(
                chatId,
                userId
            );






        // ==========================================
        // درخواست به Gemini
        // ==========================================


// ==========================================
// گرفتن اطلاعات سایت
// ==========================================

const siteContext =
await getSiteContext();



// ==========================================
// درخواست به Gemini
// ==========================================

const prompt = `


${context}



اطلاعات سایت:

${siteContext}



پیام جدید کاربر:

${cleanText}



قوانین:

- تو روبو هستی.
- اطلاعات سایت را تحلیل کن.
- اگر سوال درباره سایت بود از اطلاعات سایت استفاده کن.
- اگر اطلاعاتی وجود نداشت حدس نزن.
- دوستانه جواب بده.
- اگر اسم کاربر را در حافظه داری استفاده کن.
- تاریخچه گفتگو را در نظر بگیر.


`;




        const answer =
        await askGemini(
            prompt
        );






        // ==========================================
        // ذخیره حافظه
        // ==========================================

await saveMemory({

    chatId,

    userId,

    username,

    name:

    userName ||
    null,

    message:

    cleanText,

    answer

});






        return send(

            msg.chat.id,

            answer

        );





    }
    catch(error){



        console.log(
            "❌ ROBO MESSAGE ERROR:",
            error.message
        );



    }



});






// ======================================================
// POLLING ERROR
// ======================================================


bot.on(
"polling_error",
(error)=>{


console.log(
"POLLING ERROR:",
error.message
);


}

);



}






// ======================================================
// NEW FILE NOTIFY
// ======================================================


async function notifyNewFile(data){


    try{


        const chat =
        process.env.TELEGRAM_ADMIN_ID;



        if(!chat)
            return;



        const text = `

📥 فایل جدید سایت


📄 ${data.name}


📚 ${data.lesson || "نامشخص"}


📦 ${data.size} bytes


🤖 Riseo File Bot

`;



        await bot.sendMessage(
            chat,
            text
        );



        console.log(
            "✅ NEW FILE SENT"
        );



    }
    catch(error){


        console.log(
            "❌ NOTIFY ERROR:",
            error.message
        );


    }


}







module.exports = {


    startBot,

    notifyNewFile


};