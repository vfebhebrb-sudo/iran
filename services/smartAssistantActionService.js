const StudyPlan = require("../models/StudyPlan");


// ======================================================
// SMART ASSISTANT ACTION SERVICE
// ======================================================


// ======================================================
// ACCESS CONTROL
// ======================================================

function canPerformActions(context){

    if(!context){
        return false;
    }

    const settings =
        context.aiSettings || {};

    if(settings.enabled !== true){
        return false;
    }

    if(settings.actions !== true){
        return false;
    }

    if(settings.accessLevel !== "full"){
        return false;
    }

    return true;
}


// ======================================================
// NORMALIZE DAY
// ======================================================

function normalizeDay(day){

    if(!day){
        return null;
    }

    const value =
        String(day)
            .trim()
            .toLowerCase();


    const days = {

        "شنبه": "saturday",
        "یکشنبه": "sunday",
        "یک‌شنبه": "sunday",
        "دوشنبه": "monday",
        "سه‌شنبه": "tuesday",
        "سه شنبه": "tuesday",
        "چهارشنبه": "wednesday",
        "پنجشنبه": "thursday",
        "پنج‌شنبه": "thursday",
        "جمعه": "friday",

        "saturday": "saturday",
        "sunday": "sunday",
        "monday": "monday",
        "tuesday": "tuesday",
        "wednesday": "wednesday",
        "thursday": "thursday",
        "friday": "friday",

    };


    if(days[value]){
        return days[value];
    }


    // ----------------------------------------------
    // امروز
    // ----------------------------------------------

    if(
        value === "امروز" ||
        value === "today"
    ){

        return new Date()
            .toLocaleDateString(
                "en-US",
                {
                    weekday:"long"
                }
            )
            .toLowerCase();

    }


    // ----------------------------------------------
    // فردا
    // ----------------------------------------------

    if(
        value === "فردا" ||
        value === "tomorrow"
    ){

        const date =
            new Date();

        date.setDate(
            date.getDate() + 1
        );

        return date
            .toLocaleDateString(
                "en-US",
                {
                    weekday:"long"
                }
            )
            .toLowerCase();

    }


    return value;
}


// ======================================================
// NORMALIZE DURATION
// ======================================================

function normalizeDuration(duration){

    if(
        duration === undefined ||
        duration === null ||
        duration === ""
    ){

        return null;

    }


    // ----------------------------------------------
    // اگر عدد باشد
    // ----------------------------------------------

    if(typeof duration === "number"){

        if(!Number.isFinite(duration)){
            return null;
        }

        return duration;

    }


    let value =
        String(duration)
            .trim()
            .toLowerCase();


    // ----------------------------------------------
    // اعداد فارسی
    // ----------------------------------------------

    const persianNumbers = {

        "۰":"0",
        "۱":"1",
        "۲":"2",
        "۳":"3",
        "۴":"4",
        "۵":"5",
        "۶":"6",
        "۷":"7",
        "۸":"8",
        "۹":"9"

    };


    value =
        value.replace(
            /[۰-۹]/g,
            char =>
                persianNumbers[char]
        );


    // ----------------------------------------------
    // تبدیل اعداد متنی ساده
    // ----------------------------------------------

    const wordNumbers = {

        "یک": 1,
        "دو": 2,
        "سه": 3,
        "چهار": 4,
        "پنج": 5,
        "شش": 6,
        "هفت": 7,
        "هشت": 8,
        "نه": 9,
        "ده": 10

    };


    for(
        const word in wordNumbers
    ){

        if(value.includes(word)){

            const number =
                wordNumbers[word];

            if(
                value.includes("دقیقه")
            ){

                return number / 60;

            }

            return number;

        }

    }


    // ----------------------------------------------
    // حالت "120 دقیقه"
    // ----------------------------------------------

    const minuteMatch =
        value.match(
            /(\d+(?:\.\d+)?)\s*(دقیقه|دقیقه‌ای|minute|minutes|min)/
        );


    if(minuteMatch){

        const minutes =
            Number(
                minuteMatch[1]
            );

        return minutes / 60;

    }


    // ----------------------------------------------
    // حالت "2 ساعت"
    // ----------------------------------------------

    const hourMatch =
        value.match(
            /(\d+(?:\.\d+)?)\s*(ساعت|ساعته|hour|hours|hr|hrs)/
        );


    if(hourMatch){

        return Number(
            hourMatch[1]
        );

    }


    // ----------------------------------------------
    // اگر فقط عدد بود
    // ----------------------------------------------

    const numericMatch =
        value.match(
            /\d+(?:\.\d+)?/
        );


    if(numericMatch){

        return Number(
            numericMatch[0]
        );

    }


    return null;
}


// ======================================================
// NORMALIZE SUBJECT
// ======================================================

function normalizeSubject(data){

    const subject =
        data.subject ||
        data.subjectName;


    if(!subject){
        return null;
    }


    return String(subject).trim();

}


// ======================================================
// CREATE STUDY PLAN
// ======================================================

async function createStudyPlan(
    phone,
    data
){

    if(!phone){

        throw new Error(
            "کاربر شناسایی نشد."
        );

    }


    data =
        data || {};


    // ----------------------------------------------
    // Subject
    // ----------------------------------------------

    const subject =
        normalizeSubject(data);


    const subjectName =
        data.subjectName ||
        subject;


    // ----------------------------------------------
    // Day
    // ----------------------------------------------

    const day =
        normalizeDay(
            data.day
        );


    // ----------------------------------------------
    // Duration
    // ----------------------------------------------

    const duration =
        normalizeDuration(
            data.duration
        );


    // ----------------------------------------------
    // Title
    // ----------------------------------------------

    const title =
        data.title
            ? String(data.title).trim()
            : "";


    // ----------------------------------------------
    // Validation
    // ----------------------------------------------

    if(
        !day ||
        !subject ||
        !subjectName ||
        !title ||
        duration === null
    ){

        console.error(
            "❌ CREATE PLAN INVALID DATA:",
            {
                day,
                subject,
                subjectName,
                title,
                duration,
                originalData:data
            }
        );


        throw new Error(
            "اطلاعات برنامه کامل نیست."
        );

    }


    // ----------------------------------------------
    // Create
    // ----------------------------------------------

    const plan =
        await StudyPlan.create({

            phone,

            day,

            subject,

            subjectName,

            icon:
                data.icon ||
                "book-open",

            color:
                data.color ||
                "#6366f1",

            title,

            note:
                data.note
                    ? String(data.note)
                    : "",

            duration

        });


    console.log(
        "✅ SMART ASSISTANT PLAN CREATED:",
        plan
    );


    return plan;

}


// ======================================================
// UPDATE STUDY PLAN
// ======================================================

async function updateStudyPlan(
    phone,
    planId,
    data
){

    if(!phone){

        throw new Error(
            "کاربر شناسایی نشد."
        );

    }


    if(!planId){

        throw new Error(
            "شناسه برنامه مشخص نیست."
        );

    }


    const plan =
        await StudyPlan.findOne({

            _id: planId,

            phone: phone

        });


    if(!plan){

        throw new Error(
            "برنامه پیدا نشد یا متعلق به این کاربر نیست."
        );

    }


    data =
        data || {};


    // ----------------------------------------------
    // Day
    // ----------------------------------------------

    if(data.day !== undefined){

        const day =
            normalizeDay(
                data.day
            );


        if(day){
            plan.day = day;
        }

    }


    // ----------------------------------------------
    // Subject
    // ----------------------------------------------

    if(
        data.subject !== undefined ||
        data.subjectName !== undefined
    ){

        const subject =
            data.subject ||
            data.subjectName;


        if(subject){

            plan.subject =
                String(subject).trim();

            plan.subjectName =
                data.subjectName
                    ? String(
                        data.subjectName
                    ).trim()
                    : plan.subject;

        }

    }


    // ----------------------------------------------
    // Icon
    // ----------------------------------------------

    if(data.icon !== undefined){

        plan.icon =
            data.icon || "book-open";

    }


    // ----------------------------------------------
    // Color
    // ----------------------------------------------

    if(data.color !== undefined){

        plan.color =
            data.color || "#6366f1";

    }


    // ----------------------------------------------
    // Title
    // ----------------------------------------------

    if(data.title !== undefined){

        const title =
            String(data.title).trim();


        if(title){
            plan.title = title;
        }

    }


    // ----------------------------------------------
    // Note
    // ----------------------------------------------

    if(data.note !== undefined){

        plan.note =
            String(data.note);

    }


    // ----------------------------------------------
    // Duration
    // ----------------------------------------------

    if(data.duration !== undefined){

        const duration =
            normalizeDuration(
                data.duration
            );


        if(duration === null){

            throw new Error(
                "مدت زمان برنامه معتبر نیست."
            );

        }


        plan.duration =
            duration;

    }


    await plan.save();


    console.log(
        "✅ SMART ASSISTANT PLAN UPDATED:",
        plan
    );


    return plan;

}


// ======================================================
// DELETE STUDY PLAN
// ======================================================

async function deleteStudyPlan(
    phone,
    planId
){

    if(!phone){

        throw new Error(
            "کاربر شناسایی نشد."
        );

    }


    if(!planId){

        throw new Error(
            "شناسه برنامه مشخص نیست."
        );

    }


    const plan =
        await StudyPlan.findOne({

            _id: planId,

            phone: phone

        });


    if(!plan){

        throw new Error(
            "برنامه پیدا نشد یا متعلق به این کاربر نیست."
        );

    }


    await StudyPlan.deleteOne({

        _id: planId,

        phone: phone

    });


    console.log(
        "🗑️ SMART ASSISTANT PLAN DELETED:",
        planId
    );


    return {

        success: true,

        planId

    };

}


// ======================================================
// GET STUDY PLANS
// ======================================================

async function getStudyPlans(
    phone
){

    if(!phone){

        throw new Error(
            "کاربر شناسایی نشد."
        );

    }


    const plans =
        await StudyPlan.find({

            phone: phone

        }).sort({

            createdAt: -1

        });


    return plans;

}


// ======================================================
// MAIN ACTION HANDLER
// ======================================================

async function executeSmartAssistantAction({

    action,
    phone,
    context,
    data = {}

}){

    // ----------------------------------------------
    // Access Control
    // ----------------------------------------------

    if(
        !canPerformActions(
            context
        )
    ){

        return {

            success:false,

            code:
                "ACTION_NOT_ALLOWED",

            message:
                "دستیار اجازه انجام این عملیات را ندارد."

        };

    }


    try{

        switch(action){


            // ==========================================
            // CREATE
            // ==========================================

            case "CREATE_STUDY_PLAN":

                return {

                    success:true,

                    action,

                    result:
                        await createStudyPlan(
                            phone,
                            data
                        )

                };


            // ==========================================
            // UPDATE
            // ==========================================

            case "UPDATE_STUDY_PLAN":

                return {

                    success:true,

                    action,

                    result:
                        await updateStudyPlan(
                            phone,
                            data.planId,
                            data
                        )

                };


            // ==========================================
            // DELETE
            // ==========================================

            case "DELETE_STUDY_PLAN":

                return {

                    success:true,

                    action,

                    result:
                        await deleteStudyPlan(
                            phone,
                            data.planId
                        )

                };


            // ==========================================
            // GET
            // ==========================================

            case "GET_STUDY_PLANS":

                return {

                    success:true,

                    action,

                    result:
                        await getStudyPlans(
                            phone
                        )

                };


            // ==========================================
            // FUTURE ACTIONS
            // ==========================================

            default:

                return {

                    success:false,

                    code:
                        "UNKNOWN_ACTION",

                    message:
                        "این عملیات هنوز برای دستیار فعال نشده است."

                };

        }

    }
    catch(error){

        console.error(
            "❌ SMART ASSISTANT ACTION ERROR:",
            error
        );


        return {

            success:false,

            code:
                "ACTION_ERROR",

            message:
                error.message ||
                "خطا در انجام عملیات."

        };

    }

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    canPerformActions,

    executeSmartAssistantAction

};