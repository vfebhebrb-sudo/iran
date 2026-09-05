
const axios = require("axios");
const fs = require("fs");
const path = require("path");


const File = require("../models/File");

// =====================================================
// TOKEN
// =====================================================

const TOKEN = process.env.RUBIKA_TOKEN_file;


if(!TOKEN){

    console.error(
        "❌ RUBIKA_TOKEN پیدا نشد!"
    );

    process.exit(1);

}


// =====================================================
// MONGODB
// =====================================================

// const MONGO_URI =
// process.env.MONGO_URI;


// if(!MONGO_URI){

//     console.error(
//         "❌ MONGO_URI پیدا نشد!"
//     );

//     process.exit(1);

// }


// mongoose
// .connect(MONGO_URI)
// .then(() => {

//     console.log(
//         "✅ MongoDB connected"
//     );

// })
// .catch((error) => {

//     console.error(
//         "❌ MongoDB ERROR:",
//         error.message
//     );

// });

// // =====================================================
// API
// =====================================================

const api = axios.create({

    timeout:15000,

    headers:{
        "Content-Type":"application/json"
    }

});


// =====================================================
// OFFSET
// =====================================================

const offsetFile =
path.join(
    __dirname,
    "offset.json"
);


let offset_id = null;


if(fs.existsSync(offsetFile)){

    try{

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
    catch(error){

        console.log(
            "⚠️ خطا در خواندن offset.json"
        );

        offset_id = null;

    }

}


function saveOffset(){

    try{

        fs.writeFileSync(

            offsetFile,

            JSON.stringify(
                {
                    offset_id
                },
                null,
                2
            )

        );

    }
    catch(error){

        console.log(
            "❌ OFFSET SAVE ERROR:",
            error.message
        );

    }

}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage(
    chat_id,
    text
){

    try{

        const response =
        await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/sendMessage`,

            {
                chat_id,
                text
            }

        );


        console.log(
            "✅ MESSAGE SENT:",
            chat_id
        );


        return response.data;

    }
    catch(error){

        console.log(
            "❌ SEND ERROR:",
            error.response?.data ||
            error.message
        );

    }

}


// =====================================================
// GET FILE INFO
// =====================================================

async function getFileInfo(file_id){

    try{

        const response =
        await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/getFile`,

            {
                file_id
            }

        );


        console.log("");

        console.log(
            "📦 GET FILE RESPONSE:"
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
    catch(error){

        console.log("");

        console.log(
            "❌ GET FILE ERROR:"
        );

        console.log(
            error.response?.data ||
            error.message
        );

        console.log("");

        return null;

    }

}

// =====================================================
// UPDATE DEBUG
// =====================================================

function showFullUpdate(update){

    console.log("");

    console.log(
        "╔══════════════════════════════════════╗"
    );

    console.log(
        "║          📦 FULL RUBIKA UPDATE       ║"
    );

    console.log(
        "╚══════════════════════════════════════╝"
    );

    console.log("");

    console.log(
        JSON.stringify(
            update,
            null,
            2
        )
    );

    console.log("");

    console.log(
        "════════════════════════════════════════"
    );

}


// =====================================================
// DETECT LESSON
// =====================================================

function detectLesson(fileName){

    const name =
    fileName
    .toLowerCase();


    if(
        name.includes("شیمی")
    ){

        return "شیمی";

    }


    if(
        name.includes("فیزیک")
    ){

        return "فیزیک";

    }


    if(
        name.includes("حسابان")
    ){

        return "حسابان";

    }


    if(
        name.includes("هندسه")
    ){

        return "هندسه";

    }


    if(
        name.includes("گسسته")
    )
    {

        return "گسسته";

    }


   return "سایر";

}

// =====================================================
// GET UPDATES
// =====================================================

let running = false;


const cooldown = {};


async function getMessages(){

    if(running)
        return;


    running = true;


    try{

        const response =
        await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/getUpdates`,

            {
                offset_id
            }

        );


        const data =
        response.data?.data;


        if(!data){

            return;

        }


        const updates =
        data.updates || [];


        // =================================================
        // PROCESS UPDATES
        // =================================================

        for(
            const update
            of updates
        ){


            // ---------------------------------------------
            // فقط پیام جدید
            // ---------------------------------------------

            if(
                update.type !== "NewMessage"
            ){

                continue;

            }


            const message =
            update.new_message;


            if(!message){

                continue;

            }


            // ---------------------------------------------
            // FULL UPDATE
            // ---------------------------------------------

            showFullUpdate(
                update
            );


            // ---------------------------------------------
            // BASIC INFO
            // ---------------------------------------------

            const text =
            message.text || "";


            const chat =
            message.chat_id ||
            update.chat_id ||
            null;


            console.log(
                "📩 TEXT:",
                text || "(بدون متن)"
            );


            console.log(
                "👤 CHAT:",
                chat
            );


            // =================================================
            // START
            // =================================================

            if(
                text === "/start"
            ){

                if(
                    cooldown[chat] &&
                    Date.now() -
                    cooldown[chat] < 5000
                ){

                    continue;

                }


                cooldown[chat] =
                Date.now();


                await sendMessage(

                    chat,

`👋 سلام، خوش آمدید

🎓 سامانه برنامه‌ریزی کنکور

━━━━━━━━━━━━━━

✨ ربات Riseo فعال است.

📚 برنامه‌ریزی مطالعه
⏱ مدیریت زمان
📝 ثبت آزمون
📊 تحلیل و گزارش پیشرفت

━━━━━━━━━━━━━━

🤖 شناسه روبیکای شما:

${chat}

━━━━━━━━━━━━━━

🚀 موفقیت با برنامه‌ریزی شروع می‌شود.`

                );

            }


            // =================================================
            // HELLO
            // =================================================

            if(
                text === "سلام"
            ){

                await sendMessage(

                    chat,

`سلام 👋

ربات Riseo فعال است ✅

شناسه روبیکای شما:

${chat}`

                );

            }


            // =================================================
            // FILE DETECTION
            // =================================================

            /*
                فعلاً این بخش فقط برای بررسی
                ساختار واقعی فایل است.

                بعد از ارسال PDF،
                از روی FULL UPDATE مشخص می‌کنیم
                فایل دقیقاً کجا قرار دارد.
            */

// =====================================================
// FILE DETECTION
// =====================================================
// =====================================================
// FILE DETECTION
// =====================================================

if(message.file){

    const file =
    message.file;


    console.log("");

    console.log(
        "╔══════════════════════════════════════╗"
    );

    console.log(
        "║            📁 FILE DETECTED          ║"
    );

    console.log(
        "╚══════════════════════════════════════╝"
    );

    console.log("");


    const fileName =
    file.file_name ||
    "بدون نام";


    const fileId =
    file.file_id;


    const fileSize =
    file.size || 0;


    // ================================================
    // DETECT LESSON
    // ================================================

    const lesson =
    detectLesson(
        fileName
    );


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
        "📚 LESSON:",
        lesson
    );


    // ================================================
    // SAVE TO MONGODB
    // ================================================

    try{

        const existingFile =
        await File.findOne({
            fileId
        });


        if(existingFile){

            console.log(
                "⚠️ FILE ALREADY EXISTS"
            );

        }
        else{

            const newFile =
            await File.create({

                name: fileName,

                lesson: lesson,

                fileId: fileId,

                fileType: "pdf",

                size: fileSize,

                source: "rubika",

                chatId: chat

            });


            console.log("");

            console.log(
                "✅ FILE SAVED TO MONGODB"
            );

            console.log(
                "🗄️ DATABASE ID:",
                newFile._id
            );

        }

    }
    catch(error){

        console.log("");

        console.log(
            "❌ FILE DATABASE ERROR:"
        );

        console.log(
            error.message
        );

    }


    // ================================================
    // GET FILE INFORMATION
    // ================================================

    await getFileInfo(
        fileId
    );

}
        }


        // =================================================
        // SAVE OFFSET
        // =================================================

        if(
            data.next_offset_id
        ){

            offset_id =
            data.next_offset_id;


            saveOffset();

        }

    }
    catch(error){

        console.log("");

        console.log(
            "❌ BOT ERROR:"
        );


        console.log(
            error.response?.data ||
            error.message
        );


        console.log("");

        await new Promise(
            resolve =>
            setTimeout(
                resolve,
                5000
            )
        );

    }
    finally{

        running = false;

    }

}


// =====================================================
// START BOT
// =====================================================

function startBot(){

    console.log("");

    console.log(
        "================================"
    );

    console.log(
        "🤖 RISEO RUBIKA BOT"
    );

    console.log(
        "================================"
    );

    console.log(
        "✅ Bot started"
    );

    console.log(
        "📡 Waiting for messages..."
    );

    console.log(
        "================================"
    );

    console.log("");



    getMessages();


    setInterval(

        getMessages,

        10000

    );

}

module.exports = startBot;