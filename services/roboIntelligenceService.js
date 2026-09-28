// ======================================================
// ROBO INTELLIGENCE SERVICE
// مغز اجتماعی روبو
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
// ANALYZE MESSAGE
// تحلیل پیام و تصمیم گیری
// ======================================================


async function analyzeMessage(data){


    const {

        chatId,
        userId,
        message

    } = data;





    const groupHistory =
    await getRecentGroupMessages(chatId);



    const userMemory =
    await getPermanentMemory(userId);







    const decision = {


        // آیا جواب بده؟
        reply:false,


        // میزان اطمینان
        confidence:0,


        // دلیل‌ها
        reasons:[],


        // موضوع
        topic:"unknown",


        // احساس
        emotion:"neutral",


        // حال و هوای گروه
        mood:"normal",


        // اولویت
        priority:"low",


        // سبک پاسخ
        style:"friendly"


    };







    const text =
    message.toLowerCase();









// ======================================================
// DIRECT ROBO CALL
// ======================================================


if(

    text.includes("روبو")

    ||

    text.includes("robo")

){


    decision.reply=true;


    decision.confidence +=50;


    decision.priority="high";


    decision.reasons.push(
        "direct_call"
    );


}










// ======================================================
// QUESTION
// ======================================================


const questions=[


"؟",

"چرا",

"چطور",

"چگونه",

"چی",

"کدوم",

"به نظرت",

"نظرت چیه"


];





if(

questions.some(
    x=>text.includes(x)
)

){


    decision.reply=true;


    decision.confidence +=30;


    decision.reasons.push(
        "question"
    );


}









// ======================================================
// HELP DETECTION
// ======================================================


const helpWords=[


"کمک",

"مشکل",

"گیر کردم",

"نمیشه",

"راه حل",

"چیکار کنم"


];





if(

helpWords.some(
    x=>text.includes(x)
)

){


    decision.reply=true;


    decision.confidence +=40;


    decision.priority="high";


    decision.reasons.push(
        "help_request"
    );


}









// ======================================================
// CONVERSATION
// ======================================================


const conversation=[


"ایده",

"پیشنهاد",

"فکر میکنی",

"چیکار کنیم",

"بیاید",

"نظرت"


];





if(

conversation.some(
x=>text.includes(x)
)

){


    decision.confidence +=20;


    decision.reply=true;


    decision.reasons.push(
        "conversation"
    );


}









// ======================================================
// EMOTION
// ======================================================



if(

text.includes("😂")

||

text.includes("🤣")

||

text.includes("خخخ")

){


decision.emotion="happy";

decision.mood="fun";


}




if(

text.includes("ناراحتم")

||

text.includes("حالم خوب نیست")

||

text.includes("مشکل دارم")

){


decision.emotion="sad";


decision.mood="supportive";


decision.reply=true;


decision.priority="high";


}









// ======================================================
// TOPIC DETECTION
// ======================================================


if(

text.includes("درس")

||

text.includes("امتحان")

||

text.includes("کنکور")

){


decision.topic="education";


}

else if(

text.includes("کد")

||

text.includes("برنامه")

||

text.includes("سایت")

){


decision.topic="programming";


}

else if(

text.includes("ایده")

){


decision.topic="idea";


}

else{


decision.topic="general";


}









// ======================================================
// FINAL SCORE
// ======================================================


if(

decision.confidence >=50

){


decision.reply=true;


}






return {


    decision,


    groupHistory,


    userMemory


};


}









// ======================================================
// BUILD ROBO CONTEXT
// ساخت حافظه برای Gemini
// ======================================================



function buildRoboContext(data){



return `



==================================================
ROBO DECISION
==================================================


${JSON.stringify(

data.decision,

null,

2

)}





==================================================
USER MEMORY
==================================================


${JSON.stringify(

data.userMemory || {},

null,

2

)}






==================================================
GROUP HISTORY
==================================================


${JSON.stringify(

data.groupHistory || [],

null,

2

)}






${getPersonality()}



`;



}









// ======================================================
// ROBO PERSONALITY
// شخصیت روبو
// ======================================================



function getPersonality(){



return `



تو روبو هستی.

یک عضو هوشمند اجتماعی داخل گروه.

تو فقط یک پاسخ‌دهنده نیستی.

تو باید مثل یک عضو باهوش گروه رفتار کنی.



قوانین اصلی:

- همیشه لازم نیست جواب بدهی.
- قبل از حرف زدن فکر کن.
- اگر حضور تو ارزشی اضافه نمی‌کند سکوت کن.
- اگر کسی کمک خواست وارد شو.
- اگر کسی مستقیم صدایت کرد جواب بده.



==================================================
رفتار اجتماعی
==================================================


تو باید:

- گرم باشی.
- دوستانه حرف بزنی.
- گاهی شوخی کوتاه داشته باشی.
- در زمان مناسب پیشنهاد بدهی.
- گفتگو را طبیعی ادامه بدهی.



تو نباید:

- زیاد حرف بزنی.
- همه پیام‌ها را جواب بدهی.
- خشک و رباتی باشی.
- جمله‌های طولانی بی‌دلیل بنویسی.



==================================================
شوخی
==================================================


شوخی:

- کوتاه
- طبیعی
- متناسب با فضا


اگر گروه جدی است شوخی نکن.

اگر کسی ناراحت است اول کمک کن.



==================================================
حافظه
==================================================


اگر اطلاعاتی از کاربران داری:

طبیعی استفاده کن.


مثال خوب:

"علی یادمه قبلاً درباره این موضوع حرف زده بودی."


مثال بد:

"طبق دیتابیس من نام شما علی است."




==================================================
تصمیم گیری
==================================================


قبل از پاسخ:

بررسی کن:

1- آیا جواب دادن لازم است؟

2- آیا کمک می‌کنم؟

3- آیا چیزی جدید اضافه می‌کنم؟

4- آیا زمان مناسبی است؟



اگر جواب همه منفی بود:

سکوت کن.



==================================================
سبک پاسخ
==================================================


جواب‌ها:

- کوتاه
- طبیعی
- دوستانه


از ایموجی در حد مناسب استفاده کن.


مثل یک دوست باهوش صحبت کن.



==================================================
هدف نهایی
==================================================


بهترین روبو کسی نیست که بیشتر حرف می‌زند.


بهترین روبو کسی است که:

در بهترین زمان

بهترین واکنش

را نشان می‌دهد.



`;

}









module.exports={


    analyzeMessage,

    buildRoboContext,

    getPersonality


};