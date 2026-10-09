"use strict";


const { GoogleGenAI } =
    require("@google/genai");


const EyeService =
    require("../services/eyeService");


const AITools =
    require("../services/aiTools");




const ai =
    new GoogleGenAI({

        apiKey:
            process.env.GEMINI_API_KEY

    });







// ======================================================
// CREATE GEMINI LIVE VOICE TOKEN
// ======================================================


async function createVoiceToken(){


    try{


        const now =
            Date.now();




        // زمان اعتبار توکن

        const expireTime =
            new Date(

                now +
                30 * 60 * 1000

            ).toISOString();




        // زمان شروع سشن

        const newSessionExpireTime =
            new Date(

                now +
                60 * 1000

            ).toISOString();






        const token =
            await ai.authTokens.create({



                config:{



                    uses:1,



                    expireTime,



                    newSessionExpireTime,





                    // ==================================
                    // GEMINI LIVE
                    // ==================================


                    bidiGenerateContentSetup:{



                        model:
                            "models/gemini-3.8-live",




                        responseModalities:[


                            "AUDIO"


                        ],





                        // ==================================
                        // TOOLS
                        // ==================================


                        tools:[


                            EyeService.tool,


                            ...AITools.tools


                        ],







                        // ==================================
                        // AI INSTRUCTION
                        // ==================================


                        systemInstruction:{



                            parts:[


                                {


                                    text:

`
تو یک دستیار هوشمند فارسی زبان هستی.

قابلیت کنترل ربات و کار با فایل‌ها را داری.

قوانین فایل:

- وقتی کاربر درباره فایل یا PDF سوال کرد ابتدا از ابزار list_files استفاده کن.

- اگر نیاز به خواندن فایل بود از ابزار open_pdf یا read_pdf استفاده کن.

- برای پاسخ درباره PDF، خودت فایل را دریافت و تحلیل کن.

- از کاربر نخواه فایل را دوباره ارسال کند اگر فایل در سیستم موجود است.

- پاسخ‌ها کوتاه، طبیعی و دقیق باشند.

`


                                },





                                {


                                    text:

                                    EyeService.instructions


                                }



                            ]



                        }



                    }



                }



            });








        if(!token?.name){


            throw new Error(

                "Gemini Live token ساخته نشد"

            );


        }







        console.log(

            "✅ GEMINI LIVE TOKEN CREATED"

        );





        return token.name;



    }


    catch(error){



        console.error(

            "❌ CREATE VOICE TOKEN ERROR:",

            error

        );



        throw error;



    }



}







module.exports = {


    createVoiceToken


};