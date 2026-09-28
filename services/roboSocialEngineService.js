// ======================================================
// ROBO SOCIAL ENGINE
// موتور اجتماعی روبو
// ======================================================


const askGemini =
require("../ai/gemini");



const {

    buildRoboContext,
    isDirectRoboCall,
    getDecisionPrompt

}
=
require("./roboIntelligenceService");





// ======================================================
// DECIDE GROUP BEHAVIOR
// تصمیم گیری توسط هوش مصنوعی
// ======================================================


async function decideGroupAction(data){


    const context =
    await buildRoboContext(data);



    const prompt = `


${getDecisionPrompt()}



اطلاعات گفتگو:


${JSON.stringify(
    context,
    null,
    2
)}



فقط JSON برگردان.


`;



    const result =
    await askGemini(prompt);



    try{


        return JSON.parse(result);


    }
    catch(error){


        return {


            reply:false,

            reason:"invalid_ai_response"


        };


    }


}









// ======================================================
// GENERATE REPLY
// ساخت جواب
// ======================================================


async function generateRoboReply(data){


    const context =
    await buildRoboContext(data);



    const prompt = `


تو روبو هستی.


شخصیت:

- گرم
- دوستانه
- کمی شوخ
- کمک کننده


اطلاعات:

${JSON.stringify(
    context,
    null,
    2
)}



جواب طبیعی بده.


قوانین:

- کوتاه باش.
- مثل دوست حرف بزن.
- اگر مناسب بود شوخی کن.
- اگر چیزی نمی‌دانی حدس نزن.



`;



    return await askGemini(prompt);



}








// ======================================================
// MAIN HANDLER
// ======================================================


async function handleRoboMessage(data){



    const direct =
    isDirectRoboCall(
        data.message
    );





    // --------------------------
    // صدا زدن مستقیم
    // --------------------------


    if(direct){


        return {


            shouldReply:true,


            answer:
            await generateRoboReply(data)


        };


    }






    // --------------------------
    // گپ گروهی
    // --------------------------


    const decision =
    await decideGroupAction(data);




    if(!decision.reply){


        return {


            shouldReply:false


        };


    }




    return {


        shouldReply:true,


        answer:
        await generateRoboReply(data)



    };



}






module.exports={


    handleRoboMessage,

    decideGroupAction,

    generateRoboReply


};