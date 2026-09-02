const express = require("express");

const smartAssistantRouter =
    express.Router();


const SmartAssistantConversation =
    require("../models/SmartAssistantConversation");


const {
    getSmartAssistantContext
} =
    require("../services/smartAssistantContextService");


const {
    runSmartAssistant,
    detectSmartAssistantAction
} =
    require("../services/smartAssistantService");


const {
    executeSmartAssistantAction
} =
    require("../services/smartAssistantActionService");


const {
    generateSmartAssistantProactiveDecision
} =
    require("../services/smartAssistantProactiveAIService");



async function getConversationMemory(
    phone
){

    try{

        const conversation =
            await SmartAssistantConversation
                .findOne({
                    phone
                })
                .lean();


        if(
            !conversation ||
            !Array.isArray(
                conversation.messages
            )
        ){

            return [];

        }


        return conversation.messages
            .slice(-1000)
            .map(
                message => ({

                    role:
                        message.role,

                    content:
                        message.content,

                    createdAt:
                        message.createdAt

                })
            );

    }
    catch(error){

        console.error(
            "❌ GET CONVERSATION MEMORY ERROR:",
            error
        );

        return [];

    }

}



async function saveConversationPair(
    phone,
    userMessage,
    assistantMessage
){

    try{

        if(!phone){
            return false;
        }


        const messages = [];


        if(
            userMessage &&
            String(
                userMessage
            ).trim()
        ){

            messages.push({

                role:
                    "user",

                content:
                    String(
                        userMessage
                    ).trim(),

                createdAt:
                    new Date()

            });

        }


        if(
            assistantMessage &&
            String(
                assistantMessage
            ).trim()
        ){

            messages.push({

                role:
                    "assistant",

                content:
                    String(
                        assistantMessage
                    ).trim(),

                createdAt:
                    new Date()

            });

        }


        if(!messages.length){
            return false;
        }


        await SmartAssistantConversation
            .findOneAndUpdate(

                {
                    phone
                },

                {

                    $push:{

                        messages:{

                            $each:
                                messages,

                            $slice:
                                -1000

                        }

                    },

                    $set:{

                        updatedAt:
                            new Date()

                    }

                },

                {

                    upsert:
                        true,

                    new:
                        true

                }

            );


        return true;

    }
    catch(error){

        console.error(
            "❌ SAVE CONVERSATION ERROR:",
            error
        );

        return false;

    }

}



const proactiveRequests =
    new Set();



function isProactiveRequestRunning(
    phone
){

    return proactiveRequests.has(
        phone
    );

}



function startProactiveRequest(
    phone
){

    proactiveRequests.add(
        phone
    );

}



function finishProactiveRequest(
    phone
){

    proactiveRequests.delete(
        phone
    );

}



smartAssistantRouter.post(

    "/message",

    async(
        req,
        res
    ) => {

        try{

            const {
                message,
                phone
            } =
                req.body || {};


            if(
                !message ||
                typeof message !== "string" ||
                !message.trim()
            ){

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "پیام خالی است."

                });

            }


            if(
                !phone ||
                typeof phone !== "string"
            ){

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "کاربر شناسایی نشد."

                });

            }


            const userMessage =
                message.trim();


            console.log(
                "\n=================================================="
            );

            console.log(
                "🤖 SMART ASSISTANT MESSAGE:",
                userMessage
            );

            console.log(
                "👤 SMART ASSISTANT USER:",
                phone
            );

            console.log(
                "=================================================="
            );


            const contextResult =
                await getSmartAssistantContext(
                    phone
                );


            if(
                contextResult.aiEnabled === false
            ){

                return res.json({

                    success:
                        false,

                    aiEnabled:
                        false,

                    message:
                        contextResult.message

                });

            }


            const context =
                contextResult.context;


            const conversationHistory =
                await getConversationMemory(
                    phone
                );


            console.log(
                "🧠 CONVERSATION MEMORY:",
                conversationHistory.length,
                "messages"
            );


            const actionResult =
                await detectSmartAssistantAction(

                    userMessage,

                    context,

                    conversationHistory

                );


            console.log(
                "⚡ SMART ASSISTANT ACTION:",
                JSON.stringify(
                    actionResult,
                    null,
                    2
                )
            );


            if(
                !actionResult ||
                actionResult.type !==
                "action"
            ){

                const reply =
                    await runSmartAssistant(

                        userMessage,

                        context,

                        conversationHistory

                    );


                await saveConversationPair(

                    phone,

                    userMessage,

                    reply

                );


                return res.json({

                    success:
                        true,

                    type:
                        "chat",

                    reply:
                        reply

                });

            }


            const action =
                actionResult.action;


            const data =
                actionResult.data || {};


            const executionResult =
                await executeSmartAssistantAction({

                    action,

                    phone,

                    context,

                    data

                });


            if(
                !executionResult.success
            ){

                const failureMessage =
                    executionResult.message ||
                    "عملیات انجام نشد.";


                await saveConversationPair(

                    phone,

                    userMessage,

                    failureMessage

                );


                return res.json({

                    success:
                        true,

                    type:
                        "action",

                    action:
                        action,

                    actionSuccess:
                        false,

                    reply:
                        failureMessage,

                    message:
                        failureMessage

                });

            }


            let successReply;


            switch(
                action
            ){

                case "CREATE_STUDY_PLAN":

                    successReply =
                        "✅ برنامه با موفقیت اضافه شد.";

                    break;


                case "UPDATE_STUDY_PLAN":

                    successReply =
                        "✅ برنامه با موفقیت ویرایش شد.";

                    break;


                case "DELETE_STUDY_PLAN":

                    successReply =
                        "✅ برنامه با موفقیت حذف شد.";

                    break;


                case "GET_STUDY_PLANS":

                    successReply =
                        "📚 برنامه‌ها با موفقیت دریافت شدند.";

                    break;


                default:

                    successReply =
                        "✅ عملیات با موفقیت انجام شد.";

            }


            await saveConversationPair(

                phone,

                userMessage,

                successReply

            );


            return res.json({

                success:
                    true,

                type:
                    "action",

                action:
                    action,

                actionSuccess:
                    true,

                result:
                    executionResult.result,

                reply:
                    successReply,

                message:
                    "عملیات با موفقیت انجام شد."

            });

        }
        catch(error){

            console.error(
                "❌ SMART ASSISTANT ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "ارتباط با دستیار هوشمند برقرار نشد."

            });

        }

    }

);



smartAssistantRouter.post(

    "/proactive",

    async(
        req,
        res
    ) => {

        try{

            const {
                phone,
                message
            } =
                req.body || {};


            if(
                !phone ||
                typeof phone !== "string" ||
                !message ||
                typeof message !== "string" ||
                !message.trim()
            ){

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "اطلاعات پیام کامل نیست."

                });

            }


            const saved =
                await saveConversationPair(

                    phone,

                    null,

                    message

                );


            if(!saved){

                return res.status(500).json({

                    success:
                        false,

                    message:
                        "ذخیره پیام انجام نشد."

                });

            }


            return res.json({

                success:
                    true

            });

        }
        catch(error){

            console.error(
                "❌ SAVE PROACTIVE MESSAGE ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "ذخیره پیام انجام نشد."

            });

        }

    }

);



smartAssistantRouter.post(

    "/proactive/check",

    async(
        req,
        res
    ) => {

        let phone = null;


        try{

            const body =
                req.body || {};


            phone =
                body.phone;


            const event =
                body.event || null;


            const eventData =
                body.eventData || {};


            if(
                !phone ||
                typeof phone !== "string"
            ){

                return res.status(400).json({

                    success:
                        false,

                    shouldSpeak:
                        false,

                    type:
                        "silent",

                    priority:
                        "none",

                    message:
                        "",

                    reason:
                        "کاربر شناسایی نشد."

                });

            }


            if(
                isProactiveRequestRunning(
                    phone
                )
            ){

                return res.json({

                    success:
                        true,

                    shouldSpeak:
                        false,

                    type:
                        "silent",

                    priority:
                        "none",

                    message:
                        "",

                    reason:
                        "یک بررسی proactive دیگر برای این کاربر در حال انجام است.",

                    blockedByConcurrentRequest:
                        true

                });

            }


            startProactiveRequest(
                phone
            );


            console.log(
                "\n=================================================="
            );

            console.log(
                "🤖 SMART ASSISTANT PROACTIVE CHECK"
            );

            console.log(
                "👤 USER:",
                phone
            );

            if(event){

                console.log(
                    "⚡ EVENT:",
                    event
                );

                console.log(
                    "📦 EVENT DATA:",
                    eventData
                );

            }

            console.log(
                "=================================================="
            );


            const contextResult =
                await getSmartAssistantContext(

                    phone,

                    {

                        event:
                            event,

                        eventData:
                            eventData

                    }

                );


            if(
                !contextResult ||
                contextResult.aiEnabled === false
            ){

                return res.json({

                    success:
                        true,

                    shouldSpeak:
                        false,

                    type:
                        "silent",

                    priority:
                        "none",

                    message:
                        "",

                    reason:
                        "Smart Assistant غیرفعال است."

                });

            }


            const context =
                contextResult.context;


            const conversationHistory =
                await getConversationMemory(
                    phone
                );


            console.log(
                "🧠 PROACTIVE MEMORY:",
                conversationHistory.length,
                "messages"
            );


            const aiResult =
                await generateSmartAssistantProactiveDecision({

                    context:
                        context,

                    conversationHistory:
                        conversationHistory

                });


            if(
                !aiResult ||
                !aiResult.success
            ){

                return res.json({

                    success:
                        false,

                    shouldSpeak:
                        false,

                    type:
                        "silent",

                    priority:
                        "none",

                    message:
                        "",

                    reason:
                        "دریافت تصمیم از هوش مصنوعی ناموفق بود."

                });

            }


            const decision =
                aiResult.decision;


            console.log(
                "🧠 PROACTIVE AI DECISION:",
                JSON.stringify(
                    decision,
                    null,
                    2
                )
            );


            if(
                decision.shouldSpeak !== true ||
                !decision.message ||
                !decision.message.trim()
            ){

                return res.json({

                    success:
                        true,

                    shouldSpeak:
                        false,

                    type:
                        "silent",

                    priority:
                        "none",

                    message:
                        "",

                    reason:
                        decision.reason || ""

                });

            }


            const saved =
                await saveConversationPair(

                    phone,

                    null,

                    decision.message

                );


            if(!saved){

                console.warn(
                    "⚠️ PROACTIVE MESSAGE SAVE FAILED"
                );


                return res.json({

                    success:
                        false,

                    shouldSpeak:
                        false,

                    type:
                        "silent",

                    priority:
                        "none",

                    message:
                        "",

                    reason:
                        "ذخیره پیام proactive انجام نشد."

                });

            }


            return res.json({

                success:
                    true,

                shouldSpeak:
                    true,

                type:
                    decision.type,

                priority:
                    decision.priority,

                message:
                    decision.message,

                reason:
                    decision.reason,

                saved:
                    true

            });

        }
        catch(error){

            console.error(
                "❌ PROACTIVE CHECK ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                shouldSpeak:
                    false,

                type:
                    "silent",

                priority:
                    "none",

                message:
                    "",

                reason:
                    "خطا در Proactive Assistant."

            });

        }
        finally{

            if(phone){

                finishProactiveRequest(
                    phone
                );

            }

        }

    }

);











smartAssistantRouter.get(

    "/history/:phone",

    async(
        req,
        res
    ) => {

        try{

            const phone =
                req.params.phone;


            if(
                !phone ||
                typeof phone !== "string"
            ){

                return res.status(400).json({

                    success:
                        false,

                    message:
                        "شماره کاربر مشخص نیست.",

                    messages:
                        []

                });

            }


            const conversation =
                await SmartAssistantConversation.findOne({

                    phone:
                        phone

                }).lean();


            if(!conversation){

                return res.json({

                    success:
                        true,

                    messages:
                        []

                });

            }


            return res.json({

                success:
                    true,

                messages:
                    conversation.messages || []

            });

        }

        catch(error){

            console.error(
                "❌ SMART ASSISTANT HISTORY ERROR:",
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    "دریافت تاریخچه پیام‌ها انجام نشد.",

                messages:
                    []

            });

        }

    }

);






















module.exports =
    smartAssistantRouter;