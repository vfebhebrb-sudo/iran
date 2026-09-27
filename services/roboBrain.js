// ======================================================
// ROBO BRAIN SERVICE
// مدیریت حافظه اختصاصی هر کاربر
// ======================================================


const {

    saveMemory,
    getMemory,
    getUserName

} = require("../models/RoboMemory");







// ======================================================
// گرفتن کانتکست کاربر
// ======================================================


async function getRoboContext(chatId,userId){


    try{


        const memories =
        await getMemory(
            chatId,
            userId
        );



        if(
            !memories ||
            memories.length === 0
        ){

            return "";

        }




        let context = `

تو روبو هستی.
این تاریخچه گفتگوهای قبلی تو با همین کاربر است:

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
// گرفتن اسم کاربر
// ======================================================


async function getKnownUserName(chatId,userId){


    try{


        return await getUserName(

            chatId,

            userId

        );


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


            userId:
            data.userId,



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








module.exports={


    getRoboContext,


    getKnownUserName,


    rememberConversation


};