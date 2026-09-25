// ======================================================
// RISEO RUBIKA AI BOT
// Rubika + Gemini
// ======================================================


require("dotenv").config();

const axios = require("axios");

const askGemini =
    require("../ai/gemini");



// ======================================================
// CONFIG
// ======================================================


const TOKEN =
    process.env.RUBIKA_FILE_CHANNEL_BOT_TOKEN;



if(!TOKEN){

    console.log(
        "❌ RUBIKA TOKEN NOT FOUND"
    );

}




const BASE_URL =
`https://botapi.rubika.ir/v3/${TOKEN}`;





const api = axios.create({

    timeout:15000,

    headers:{
        "Content-Type":"application/json"
    }

});




// ======================================================
// STATE
// ======================================================


let offset_id = null;

let started = false;





// ======================================================
// RUBIKA REQUEST
// ======================================================


async function rubika(method,data={}){


    const response =
    await api.post(

        `${BASE_URL}/${method}`,

        data

    );


    return response.data;

}






// ======================================================
// SEND MESSAGE
// ======================================================


async function sendMessage(chatId,text){


    if(!chatId){

        console.log(
            "❌ CHAT ID EMPTY"
        );

        return;

    }



    try{


        const result =
        await rubika(
            "sendMessage",
            {

                chat_id:String(chatId),

                text:String(text)

            }
        );



        console.log(
            "✅ SENT:",
            chatId
        );



        return result;


    }
    catch(error){


        console.log(
            "❌ SEND ERROR:",
            error.response?.data ||
            error.message
        );


    }


}






// ======================================================
// BOT INFO
// ======================================================


async function getMe(){


    try{


        const data =
        await rubika(
            "getMe"
        );


        console.log(
            "🤖 BOT:",
            JSON.stringify(
                data,
                null,
                2
            )
        );



        return data;


    }
    catch(error){


        console.log(
            "❌ GET ME ERROR:",
            error.message
        );


        return null;

    }


}








// ======================================================
// MESSAGE HANDLER
// ======================================================


async function handleMessage(update){



    const message =
        update?.new_message;



    if(!message){

        return;

    }




    const text =
        message.text?.trim();



    if(!text){

        return;

    }





    const chatId =

        message.chat_id ||

        message.object_guid ||

        update.chat_id;





    console.log("");

    console.log(
        "📩 NEW MESSAGE"
    );

    console.log(
        "CHAT:",
        chatId
    );

    console.log(
        "TEXT:",
        text
    );






    if(!chatId){

        console.log(
            "⚠️ CHAT NOT FOUND"
        );

        return;

    }







    // -------------------------
    // START
    // -------------------------


    if(text === "/start"){


        await sendMessage(

            chatId,

`
🤖 ربات هوش مصنوعی فعال شد.

هر سوالی داری بپرس.
`

        );


        return;

    }








    // -------------------------
    // GEMINI
    // -------------------------


    try{


        await sendMessage(

            chatId,

            "⏳ در حال فکر کردن..."

        );



        const answer =

            await askGemini(text);





        await sendMessage(

            chatId,

            answer

        );



    }

    catch(error){


        console.log(
            "❌ AI ERROR:",
            error.message
        );



        await sendMessage(

            chatId,

            "❌ خطا در دریافت پاسخ هوش مصنوعی"

        );


    }



}








// ======================================================
// GET UPDATES
// ======================================================


async function getUpdates(){


    try{


        const result =

        await rubika(

            "getUpdates",

            {

                offset_id

            }

        );





        const data =

            result?.data;



        if(!data){

            return;

        }






        const updates =

            data.updates || [];





        for(const update of updates){


            try{


                console.log(
                    "UPDATE TYPE:",
                    update.type
                );



                await handleMessage(
                    update
                );


            }
            catch(error){


                console.log(
                    "UPDATE ERROR:",
                    error.message
                );


            }


        }





        if(data.next_offset_id){


            offset_id =

            data.next_offset_id;


        }




    }

    catch(error){


        console.log(

            "❌ GET UPDATES ERROR:",

            error.response?.data ||
            error.message

        );


    }


}







// ======================================================
// START
// ======================================================


async function startBot(){



    if(started){

        return;

    }


    started=true;



    console.log(
        "================================"
    );


    console.log(
        "🤖 RUBIKA GEMINI BOT STARTED"
    );


    console.log(
        "================================"
    );



    const bot =

        await getMe();



    if(!bot){


        console.log(
            "❌ BOT CONNECTION FAILED"
        );


        return;


    }





    await getUpdates();




    setInterval(

        getUpdates,

        3000

    );



}






// ======================================================
// EXPORT
// ======================================================


module.exports = {


    startBot,

    sendMessage,

    getUpdates,

    getMe


};