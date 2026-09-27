// ======================================================
// TELEGRAM SMART BOT
// ======================================================


const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const askGemini =
require("../ai/gemini");

const {
    saveMemory,
    getMemory
} =
require("../services/roboMemoryService");


console.log(
    "🔥 TELEGRAM BOT FILE LOADED"
);



const TOKEN =
process.env.TELEGRAM_TOKEN;



let bot = null;



const FILE_DIR =
path.join(
    __dirname,
    "../temp-files"
);




// ===============================
// FILES
// ===============================


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




// ===============================
// SEND
// ===============================

async function send(chat, text) {
    try {

        console.log("📤 SENDING TO:", chat);
        console.log("📝 TEXT:", text);

        const result = await bot.sendMessage(chat, text);

        console.log("✅ MESSAGE SENT:", result.message_id);

    } catch (e) {

        console.log("❌ SEND ERROR:", e);
        console.log("❌ SEND ERROR MESSAGE:", e.message);

    }
}
// ===============================
// START
// ===============================


function startBot(){



if(!TOKEN){

console.log(
"❌ TELEGRAM_TOKEN missing"
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
"🤖 Telegram Smart Bot Started"
);




// تست

bot.getMe()
.then(me=>{

console.log(
"✅ Connected:",
me.username
);


});






// ===============================
// ALL MESSAGE
// ===============================


bot.on(
"message",
async(msg)=>{


if(!msg.text)
return;



const text =
msg.text.trim();

// ===============================
// ROBO CALL CHECK
// ===============================

const isRobo =
text.toLowerCase()
.includes("روبو");


if(!isRobo){

    return;

}

console.log(
"📩 MESSAGE:",
text
);





// ----------------
// START
// ----------------


if(text === "/start"){


return send(
msg.chat.id,


`👋 سلام ${msg.from.first_name || ""}


🤖 ربات هوشمند فعال شد.


دستورات:

📁 لیست فایل ها

📥 دریافت 1

یا هر سوالی داری بپرس.`

);


}





// ----------------
// سلام
// ----------------


if(
text === "سلام"
){


return send(
msg.chat.id,

"سلام 👋\nربات فعاله ✅"

);


}





// ----------------
// FILE LIST
// ----------------


if(
text === "لیست فایل ها"
){


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

});



return send(
msg.chat.id,
result
);


}





// ----------------
// SEND FILE
// ----------------


const match =
text.match(
/دریافت\s+(\d+)/
);



if(match){


const index =
Number(match[1])-1;


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





// ----------------
// GEMINI
// ----------------



await send(
    msg.chat.id,
    "⏳ دارم فکر می‌کنم..."
);


// ===============================
// GET ROBO MEMORY
// ===============================

const memory =
await getMemory(
    msg.chat.id
);



// تبدیل حافظه به متن برای Gemini

let memoryText = "";



if(memory.length > 0){


    memory.reverse()
    .forEach(item=>{


        memoryText += `

کاربر:
${item.message}


روبو:
${item.answer}


`;

    });


}



// ===============================
// SEND TO GEMINI
// ===============================


const prompt = `

تو روبو هستی.
یک دستیار هوشمند دوستانه.


تاریخچه گفتگو:

${memoryText}


پیام جدید کاربر:

${text}


با توجه به تاریخچه جواب بده.

`;



const answer =
await askGemini(
    prompt
);



// ===============================
// SAVE MEMORY
// ===============================

await saveMemory({

    chatId:
    msg.chat.id,


    name:
    msg.from.first_name || null,


    username:
    msg.from.username || null,


    message:
    text,


    answer

});



return send(
    msg.chat.id,
    answer
);
});





// ERROR

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
// NEW FILE NOTIFICATION
// ======================================================

async function notifyNewFile(data){


    try{


        const chat =
        process.env.TELEGRAM_ADMIN_ID;



        if(!chat){

            console.log(
                "❌ TELEGRAM_ADMIN_ID missing"
            );

            return;

        }



        const text =
`
📥 فایل جدید سایت دریافت شد

━━━━━━━━━━━━━━

📄 نام فایل:
${data.name}


📚 درس:
${data.lesson || "نامشخص"}


📦 حجم:
${data.size} bytes


🆔 شناسه فایل:
${data.fileId}


🔗 لینک مشاهده:
${data.link || "ندارد"}


━━━━━━━━━━━━━━

🤖 Riseo File Bot
`;



        await bot.sendMessage(
            chat,
            text
        );


        console.log(
            "✅ Telegram new file sent"
        );


    }
    catch(error){


        console.log(
            "❌ TELEGRAM NOTIFY ERROR:",
            error.message
        );


    }

}

module.exports={

    startBot,

    notifyNewFile

};