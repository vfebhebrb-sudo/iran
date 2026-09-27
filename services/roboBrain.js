// ======================================================
// ROBO BRAIN SERVICE
// مدیریت حافظه و آماده سازی اطلاعات برای Gemini
// ======================================================


const {
    saveMemory,
    getMemory,
    getUserName
} = require("../models/RoboMemory");




// ======================================================
// گرفتن حافظه کاربر
// ======================================================

async function getRoboContext(chatId){


    try{


        const memories =
        await getMemory(chatId);



        if(
            !memories ||
            memories.length === 0
        ){

            return "";

        }



        let context = `

تو روبو هستی.
این تاریخچه گفتگوهای قبلی تو با این کاربر است:

`;



        memories.forEach(item=>{


            context += `

کاربر:
${item.message}


روبو:
${item.answer || ""}


`;

        });



        return context;


    }
    catch(error){


        console.log(
            "❌ ROBO CONTEXT ERROR:",
            error.message
        );


        return "";


    }


}







// ======================================================
// گرفتن اسم شناخته شده کاربر
// ======================================================

async function getKnownUserName(chatId){


    try{


        const name =
        await getUserName(chatId);



        return name;


    }
    catch(error){


        return null;


    }


}






// ======================================================
// ذخیره گفتگو
// ======================================================

async function rememberConversation(data){



    try{


        await saveMemory({


            chatId:
            data.chatId,


            username:
            data.username,


            name:
            data.name,


            message:
            data.message,


            answer:
            data.answer



        });



    }
    catch(error){


        console.log(
            "❌ ROBO REMEMBER ERROR:",
            error.message
        );


    }


}






module.exports = {


    getRoboContext,


    getKnownUserName,


    rememberConversation


};