// ======================================================
// ROBO INTELLIGENCE SERVICE
// مغز اطلاعاتی روبو
// ======================================================


const {
    getRecentGroupMessages
}
=
require("./roboGroupMemoryService");


const {
    getPermanentMemory
}
=
require("./roboPermanentMemoryService");




// ======================================================
// BUILD ROBO CONTEXT
// ======================================================


async function buildRoboContext(data){


    const {

        chatId,
        userId,
        message

    } = data;




    const groupHistory =
    await getRecentGroupMessages(chatId);



    const userMemory =
    await getPermanentMemory(userId);





    return {


        message,


        groupHistory,


        userMemory,



        timestamp:
        new Date()



    };


}






// ======================================================
// DIRECT CALL CHECK
// فقط تشخیص صدا زدن مستقیم
// ======================================================


function isDirectRoboCall(text){


    const value =
    text.toLowerCase();



    return (

        value.includes("روبو")

        ||

        value.includes("robo")

    );


}








// ======================================================
// DECISION PROMPT
// ======================================================


function getDecisionPrompt(){


return `


تو مغز تصمیم گیری روبو هستی.


دو حالت وجود دارد:


حالت اول:
کاربر مستقیم روبو را صدا زده است.

در این حالت:
- حتما باید جواب بدهی.
- سکوت ممنوع است.



حالت دوم:
گفتگوی عادی گروه است.

در این حالت خودت تصمیم بگیر:


آیا حضور روبو ارزش ایجاد می‌کند؟


اگر:
- کمک می‌کنی
- اطلاعات مفید داری
- می‌توانی گفتگو را بهتر کنی
- شوخی مناسب داری


جواب بده.


اگر نه:

سکوت کن.



هدف تو زیاد حرف زدن نیست.

هدف تو بهترین واکنش در بهترین زمان است.



خروجی تصمیم:

{
 reply:true/false,
 reason:"",
 mood:"",
 style:""
}



`;

}





module.exports={


    buildRoboContext,

    isDirectRoboCall,

    getDecisionPrompt


};