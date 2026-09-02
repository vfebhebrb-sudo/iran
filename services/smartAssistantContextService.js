const User = require("../models/User");
const StudyPlan = require("../models/StudyPlan");
const SmartAssistantConversation =
    require("../models/SmartAssistantConversation");


async function getSmartAssistantContext(
    phone,
    options = {}
){

    if(
        !phone ||
        typeof phone !== "string"
    ){

        throw new Error(
            "شماره کاربر معتبر نیست."
        );

    }


    const user =
        await User
            .findOne({
                phone: phone
            })
            .lean();


    if(!user){

        throw new Error(
            "کاربر پیدا نشد."
        );

    }


    const aiSettings =
        user.aiSettings || {

            enabled:true,

            accessLevel:"study",

            profile:true,

            studyPlans:true,

            performance:false,

            actions:false

        };


    if(!aiSettings.enabled){

        return {

            aiEnabled:false,

            message:
                "دستیار هوشمند توسط کاربر غیرفعال شده است."

        };

    }


    const now =
        new Date();


    const hour =
        now.getHours();


    const minute =
        now.getMinutes();


    let timePeriod =
        "night";


    if(
        hour >= 5 &&
        hour < 12
    ){

        timePeriod =
            "morning";

    }
    else if(
        hour >= 12 &&
        hour < 17
    ){

        timePeriod =
            "afternoon";

    }
    else if(
        hour >= 17 &&
        hour < 22
    ){

        timePeriod =
            "evening";

    }


    const weekday =
        now
            .toLocaleDateString(
                "en-US",
                {
                    weekday:"long"
                }
            )
            .toLowerCase();


    const context = {

        currentDate:
            now,

        currentTime:{

            hour:hour,

            minute:minute,

            formatted:
                `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`,

            period:
                timePeriod

        },


        today:{

            day:
                weekday,

            plans:[],

            totalPlans:0,

            completedPlans:0,

            remainingPlans:0,

            totalStudyMinutes:0,

            completedStudyMinutes:0,

            remainingStudyMinutes:0

        },


        user:null,

        study:null,

        performance:null,


        activity:{

            currentEvent:
                options.event || null,

            currentEventData:
                options.eventData || {},

            lastActivityAt:
                options.lastActivityAt || null,

            minutesSinceLastActivity:
                null

        },


        proactive:{

            lastMessageAt:null,

            minutesSinceLastMessage:null,

            recentMessages:[],

            todayMessageCount:0

        },


        aiSettings:{

            enabled:
                aiSettings.enabled,

            accessLevel:
                aiSettings.accessLevel,

            profile:
                aiSettings.profile,

            studyPlans:
                aiSettings.studyPlans,

            performance:
                aiSettings.performance,

            actions:
                aiSettings.actions

        }

    };


    if(
        context.activity.lastActivityAt
    ){

        const lastActivity =
            new Date(
                context.activity
                    .lastActivityAt
            );


        if(
            !Number.isNaN(
                lastActivity.getTime()
            )
        ){

            context.activity
                .minutesSinceLastActivity =
                    Math.floor(
                        (
                            now.getTime() -
                            lastActivity.getTime()
                        ) /
                        60000
                    );

        }

    }


    if(
        aiSettings.profile === true &&
        (
            aiSettings.accessLevel ===
                "study" ||
            aiSettings.accessLevel ===
                "analysis" ||
            aiSettings.accessLevel ===
                "full"
        )
    ){

        context.user = {

            fullname:
                user.fullname,

            targetField:
                user.targetField,

            targetUniversity:
                user.targetUniversity,

            bio:
                user.bio,

            league:
                user.league

        };

    }


    if(
        aiSettings.studyPlans === true &&
        (
            aiSettings.accessLevel ===
                "study" ||
            aiSettings.accessLevel ===
                "analysis" ||
            aiSettings.accessLevel ===
                "full"
        )
    ){

        const plans =
            await StudyPlan
                .find({
                    phone:phone
                })
                .sort({
                    createdAt:-1
                })
                .lean();


        const completedPlans =
            plans.filter(
                plan =>
                    plan.completed === true
            );


        const remainingPlans =
            plans.filter(
                plan =>
                    plan.completed !== true
            );


        const totalStudyMinutes =
            plans.reduce(
                (
                    total,
                    plan
                ) =>
                    total +
                    Number(
                        plan.duration || 0
                    ),
                0
            );


        const todayPlans =
            plans.filter(
                plan =>
                    String(
                        plan.day
                    )
                    .toLowerCase() ===
                    weekday
            );


        const todayCompletedPlans =
            todayPlans.filter(
                plan =>
                    plan.completed === true
            );


        const todayRemainingPlans =
            todayPlans.filter(
                plan =>
                    plan.completed !== true
            );


        const todayStudyMinutes =
            todayPlans.reduce(
                (
                    total,
                    plan
                ) =>
                    total +
                    Number(
                        plan.duration || 0
                    ),
                0
            );


        const completedStudyMinutes =
            todayCompletedPlans.reduce(
                (
                    total,
                    plan
                ) =>
                    total +
                    Number(
                        plan.duration || 0
                    ),
                0
            );


        const remainingStudyMinutes =
            todayRemainingPlans.reduce(
                (
                    total,
                    plan
                ) =>
                    total +
                    Number(
                        plan.duration || 0
                    ),
                0
            );


        context.today = {

            day:
                weekday,

            plans:
                todayPlans.map(
                    plan => ({

                        id:
                            plan._id,

                        subject:
                            plan.subject,

                        subjectName:
                            plan.subjectName,

                        title:
                            plan.title,

                        note:
                            plan.note,

                        duration:
                            plan.duration,

                        completed:
                            plan.completed

                    })
                ),

            totalPlans:
                todayPlans.length,

            completedPlans:
                todayCompletedPlans.length,

            remainingPlans:
                todayRemainingPlans.length,

            totalStudyMinutes:
                todayStudyMinutes,

            completedStudyMinutes:
                completedStudyMinutes,

            remainingStudyMinutes:
                remainingStudyMinutes

        };


        context.study = {

            plans:
                plans.map(
                    plan => ({

                        id:
                            plan._id,

                        day:
                            plan.day,

                        subject:
                            plan.subject,

                        subjectName:
                            plan.subjectName,

                        title:
                            plan.title,

                        note:
                            plan.note,

                        duration:
                            plan.duration,

                        completed:
                            plan.completed

                    })
                ),

            totalPlans:
                plans.length,

            completedPlans:
                completedPlans.length,

            remainingPlans:
                remainingPlans.length,

            totalStudyMinutes:
                totalStudyMinutes

        };

    }


    if(
        aiSettings.performance === true &&
        (
            aiSettings.accessLevel ===
                "analysis" ||
            aiSettings.accessLevel ===
                "full"
        )
    ){

        context.performance = {

            studyDays:
                user.studyDays,

            completedExams:
                user.completedExams,

            previousScore:
                user.previousScore,

            totalQuestionsAnswered:
                user.totalQuestionsAnswered,

            totalCorrectAnswers:
                user.totalCorrectAnswers,

            totalWrongAnswers:
                user.totalWrongAnswers,

            totalStudyMinutes:
                user.totalStudyMinutes

        };

    }


    try{

        const conversation =
            await SmartAssistantConversation
                .findOne({
                    phone:phone
                })
                .lean();


        if(
            conversation &&
            Array.isArray(
                conversation.messages
            )
        ){

            const messages =
                conversation.messages;


            const assistantMessages =
                messages.filter(
                    message =>
                        message.role ===
                        "assistant"
                );


            const proactiveMessages =
                assistantMessages
                    .slice(-20);


            context.proactive
                .recentMessages =
                    proactiveMessages
                        .map(
                            message => ({

                                content:
                                    message.content,

                                createdAt:
                                    message.createdAt

                            })
                        );


            if(
                proactiveMessages.length
            ){

                const lastMessage =
                    proactiveMessages[
                        proactiveMessages.length - 1
                    ];


                context.proactive
                    .lastMessageAt =
                        lastMessage.createdAt;


                const lastMessageDate =
                    new Date(
                        lastMessage.createdAt
                    );


                if(
                    !Number.isNaN(
                        lastMessageDate.getTime()
                    )
                ){

                    context.proactive
                        .minutesSinceLastMessage =
                            Math.floor(
                                (
                                    now.getTime() -
                                    lastMessageDate.getTime()
                                ) /
                                60000
                            );

                }

            }


            const todayStart =
                new Date(
                    now
                );


            todayStart.setHours(
                0,
                0,
                0,
                0
            );


            context.proactive
                .todayMessageCount =
                    assistantMessages
                        .filter(
                            message => {

                                const date =
                                    new Date(
                                        message.createdAt
                                    );

                                return (
                                    !Number.isNaN(
                                        date.getTime()
                                    ) &&
                                    date >=
                                        todayStart
                                );

                            }
                        )
                        .length;

        }

    }
    catch(error){

        console.warn(
            "⚠️ SMART ASSISTANT MEMORY ERROR:",
            error.message
        );

    }


    return {

        aiEnabled:true,

        context:context

    };

}


module.exports = {

    getSmartAssistantContext

};