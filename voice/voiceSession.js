"use strict";

const { GoogleGenAI } = require("@google/genai");

const EyeService =
    require("../services/eyeService");

const AITools =
    require("../services/aiTools");


const ai = new GoogleGenAI({

    apiKey:
        process.env.GEMINI_API_KEY

});



// ======================================================
// CREATE GEMINI LIVE VOICE TOKEN
// ======================================================

async function createVoiceToken() {

    try {


        const now =
            Date.now();



        // --------------------------------------------------
        // Token lifetime
        // --------------------------------------------------

        const expireTime =
            new Date(
                now + 30 * 60 * 1000
            ).toISOString();



        // --------------------------------------------------
        // Session start window
        // --------------------------------------------------

        const newSessionExpireTime =
            new Date(
                now + 60 * 1000
            ).toISOString();



        // --------------------------------------------------
        // Create ephemeral token
        // --------------------------------------------------

        const token =
            await ai.authTokens.create({

                config: {


                    uses: 1,


                    expireTime,


                    newSessionExpireTime,



                    // ======================================
                    // GEMINI LIVE CONFIG
                    // ======================================

                    bidiGenerateContentSetup: {


                        model:
                            "models/gemini-3.8-live",



                        responseModalities: [

                            "AUDIO"

                        ],



                        // ==================================
                        // AVAILABLE TOOLS
                        // ==================================

                        tools: [

                            EyeService.tool,

                            ...AITools.tools

                        ],



                        // ==================================
                        // AI PERSONALITY
                        // ==================================

                        systemInstruction: {

                            parts: [

                                {

                                    text:
`
تو یک دستیار فارسی‌زبان دوستانه و مفید هستی.

پاسخ‌ها را طبیعی، کوتاه و واضح بده.

اگر کاربر درخواست تغییر حالت چشم‌های ربات را داشت،
از ابزار کنترل چشم استفاده کن.

اگر کاربر درباره فایل‌ها یا PDF ها سؤال داشت،
از ابزارهای فایل استفاده کن.
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



        if (!token?.name) {

            throw new Error(
                "Gemini token ساخته نشد"
            );

        }



        return token.name;


    }

    catch(error) {


        console.error(
            "❌ CREATE VOICE TOKEN ERROR:",
            error
        );


        throw error;

    }

}



// ======================================================
// EXPORT
// ======================================================

module.exports = {

    createVoiceToken

};