
const askGemini =
require("../ai/gemini");


const {
    buildRoboContext
}
=
require("./roboIntelligenceService");







// ======================================================
// ROBO SOCIAL ENGINE
// موتور اجتماعی روبو
// ======================================================


const {
    analyzeMessage
}
=
require("./roboIntelligenceService");



const cooldown = new Map();





function canSpeak(chatId){


    const last =
    cooldown.get(chatId);


    if(!last)
        return true;



    const diff =
    Date.now()-last;



    // جلوگیری از زیاد حرف زدن
    if(diff < 60000){
        return false;
    }



    return true;

}







function markSpoken(chatId){

    cooldown.set(
        chatId,
        Date.now()
    );

}









async function shouldRoboJoin(data){



    const analysis =
    await analyzeMessage(data);



    const decision =
    analysis.decision;



    if(!decision.reply)
        return false;



    if(decision.confidence < 60)
        return false;



    if(!canSpeak(data.chatId))
        return false;



    return {


        join:true,

        analysis


    };


}








function randomDelay(){


    return (
        Math.floor(
            Math.random()*25000
        )
        +
        5000
    );


}



async function generateSocialReply(data){


    const {

        analysis,
        message

    } = data;




    const context =
    buildRoboContext(
        analysis
    );





    const prompt = `


${context}



پیام جدید گروه:

${message}



تو الان عضو گروه هستی.

تصمیم بگیر آیا جواب طبیعی بدهی.

اگر جواب می‌دهی:

- کوتاه باشد.
- دوستانه باشد.
- مثل یک دوست حرف بزن.
- اگر مناسب بود شوخی کوچک کن.
- اگر نیاز به پیشنهاد است، پیشنهاد بده.
- اگر موضوع شخصی است، محترمانه رفتار کن.


هیچ وقت توضیح نده که هوش مصنوعی هستی.



`;





    const answer =
    await askGemini(prompt);



    return answer;



}


module.exports={


    shouldRoboJoin,

    markSpoken,

    randomDelay,

    generateSocialReply


};