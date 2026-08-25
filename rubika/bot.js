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

    timeout:15000,

    headers:{
        "Content-Type":"application/json"
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
    catch{

        offset_id = null;

    }

}



function saveOffset(){

    fs.writeFileSync(

        offsetFile,

        JSON.stringify({
            offset_id
        })

    );

}



// ===============================
// SEND MESSAGE
// ===============================


async function sendMessage(chat_id,text){


    try{


        const res =
        await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/sendMessage`,

            {

                chat_id,

                text

            }

        );


        console.log(
            "MESSAGE SENT:",
            chat_id
        );


        return res.data;


    }
    catch(error){


        console.log(

            "SEND ERROR:",

            error.response?.data ||
            error.message

        );


    }

}




// ===============================
// SEND OTP
// ===============================


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





// ===============================
// UPDATE LOOP
// ===============================


let running=false;


const cooldown={};



async function getMessages(){


    if(running)
        return;



    running=true;


    try{


        const res =
        await api.post(

            `https://botapi.rubika.ir/v3/${TOKEN}/getUpdates`,

            {
                offset_id
            }

        );



        const data =
        res.data?.data;



        if(!data)
            return;



        const updates =
        data.updates || [];



        for(const update of updates){


            if(
                update.type !== "NewMessage"
            )
            continue;



            const message =
            update.new_message;



            const text =
            message.text || "";



            const chat =
            message.chat_id ||
            update.chat_id;



            console.log(
                "MESSAGE:",
                text
            );





            // =====================
            // START
            // =====================


            if(text === "/start"){



                if(
                    cooldown[chat] &&
                    Date.now()-cooldown[chat] < 5000
                ){

                    continue;

                }



                cooldown[chat]=Date.now();



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


🤖 شناسه روبیکای شما:


📋

${chat}


👆 این عدد را نگه دارید و
در صفحه ثبت‌نام سایت وارد کنید.


━━━━━━━━━━━━━━


🚀 موفقیت با برنامه‌ریزی شروع می‌شود.`


                );


            }




            // =====================
            // HELLO
            // =====================


            if(text === "سلام"){


                await sendMessage(

                    chat,

`سلام 👋

ربات فعال است ✅

شناسه شما:

${chat}`

                );


            }



        }




        if(data.next_offset_id){


            offset_id =
            data.next_offset_id;


            saveOffset();


        }




    }
    catch(error){


        console.log(

            "BOT ERROR:",

            error.response?.data ||
            error.message

        );


        await new Promise(
            r=>setTimeout(r,5000)
        );


    }
    finally{

        running=false;

    }


}



// ===============================
// START BOT
// ===============================


function startBot(){


    console.log(
        "Rubika bot started"
    );


    getMessages();



    setInterval(

        getMessages,

        10000

    );


}




module.exports={

    startBot,

    sendMessage,

    sendOTP

};