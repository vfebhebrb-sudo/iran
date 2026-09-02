const {
    getSmartAssistantContext
} = require("./smartAssistantContextService");


function getCurrentMinutes(){

    const now =
        new Date();

    return (
        now.getHours() * 60 +
        now.getMinutes()
    );

}


function chooseProactiveAction(
    context
){

    const today =
        context?.today || {};


    const plans =
        Array.isArray(
            today.plans
        )
            ? today.plans
            : [];


    const totalPlans =
        Number(
            today.totalPlans || 0
        );


    const completedPlans =
        Number(
            today.completedPlans || 0
        );


    const remainingPlans =
        Number(
            today.remainingPlans || 0
        );


    const totalStudyMinutes =
        Number(
            today.totalStudyMinutes || 0
        );


    const currentMinutes =
        getCurrentMinutes();


    if(totalPlans === 0){

        return {

            shouldSpeak:true,

            type:
                "NO_STUDY_TODAY",

            reason:
                "برای امروز برنامه مطالعاتی وجود ندارد."

        };

    }


    if(
        completedPlans === totalPlans
    ){

        return {

            shouldSpeak:true,

            type:
                "ALL_PLANS_COMPLETED",

            reason:
                "تمام برنامه‌های امروز انجام شده‌اند."

        };

    }


    if(
        currentMinutes >= 8 * 60 &&
        currentMinutes <= 10 * 60 &&
        completedPlans === 0
    ){

        return {

            shouldSpeak:true,

            type:
                "MORNING_START",

            reason:
                "روز مطالعاتی شروع شده ولی هنوز برنامه‌ای انجام نشده است."

        };

    }


    if(
        remainingPlans > 0 &&
        completedPlans > 0
    ){

        return {

            shouldSpeak:true,

            type:
                "CONTINUE_STUDY",

            reason:
                "بخشی از برنامه انجام شده و بخشی باقی مانده است."

        };

    }


    if(
        remainingPlans > 0
    ){

        return {

            shouldSpeak:true,

            type:
                "INCOMPLETE_PLANS",

            reason:
                "برنامه‌هایی از امروز هنوز انجام نشده‌اند."

        };

    }


    return {

        shouldSpeak:false,

        type:
            "NO_ACTION",

        reason:
            "در حال حاضر پیام proactive لازم نیست."

    };

}


async function checkSmartAssistantProactive(
    phone
){

    try{

        if(!phone){

            return {

                success:false,

                shouldSpeak:false,

                message:
                    "کاربر شناسایی نشد."

            };

        }


        const contextResult =
            await getSmartAssistantContext(
                phone
            );


        if(
            !contextResult ||
            contextResult.aiEnabled === false
        ){

            return {

                success:true,

                shouldSpeak:false,

                reason:
                    "Smart Assistant غیرفعال است."

            };

        }


        const decision =
            chooseProactiveAction(
                contextResult.context
            );


        console.log(
            "\n🤖 SMART ASSISTANT PROACTIVE CHECK"
        );


        console.log(
            "👤 PHONE:",
            phone
        );


        console.log(
            "📚 TODAY:",
            JSON.stringify(
                contextResult.context?.today,
                null,
                2
            )
        );


        console.log(
            "🎯 DECISION:",
            JSON.stringify(
                decision,
                null,
                2
            )
        );


        return {

            success:true,

            shouldSpeak:
                decision.shouldSpeak,

            type:
                decision.type,

            reason:
                decision.reason

        };

    }

    catch(error){

        console.error(
            "❌ PROACTIVE CHECK ERROR:",
            error
        );


        return {

            success:false,

            shouldSpeak:false,

            message:
                "خطا در بررسی وضعیت دستیار."

        };

    }

}


module.exports = {

    checkSmartAssistantProactive

};