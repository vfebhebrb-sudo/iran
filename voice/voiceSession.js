const { GoogleGenAI } = require("@google/genai");

const EyeService =
    require("../services/eyeService");

const AITools = require("../services/aiTools");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ======================================================
// CREATE GEMINI LIVE VOICE TOKEN
// ======================================================

async function createVoiceToken() {

    const now =
        Date.now();


    // --------------------------------------------------
    // Token expiration
    // --------------------------------------------------

    const expireTime =
        new Date(
            now + 30 * 60 * 1000
        ).toISOString();


    // --------------------------------------------------
    // New session must start within 60 seconds
    // --------------------------------------------------

    const newSessionExpireTime =
        new Date(
            now + 60 * 1000
        ).toISOString();


    // ==================================================
    // CREATE EPHEMERAL TOKEN
    // ==================================================

    const token =
        await ai.authTokens.create({

            config: {

                // Token can be used for one session
                uses: 1,


                // Token lifetime
                expireTime:
                    expireTime,


                // Time allowed to start a new session
                newSessionExpireTime:
                    newSessionExpireTime,


                // ==================================================
                // LOCKED GEMINI LIVE CONFIGURATION
                // ==================================================

                bidiGenerateContentSetup: {

                    // ------------------------------------------------
                    // Gemini Live model
                    // ------------------------------------------------

                    model:
                        "models/gemini-3.8-live",


                    // ------------------------------------------------
                    // Response type
                    // ------------------------------------------------

                    responseModalities: [
                        "AUDIO"
                    ],


                    // ------------------------------------------------
                    // Eye control tool
                    // ------------------------------------------------
                    //
                    // Gemini can now call:
                    //
                    // set_eye_state({
                    //     state: "happy"
                    // })
                    //
                    // ------------------------------------------------


tools: [
    EyeService.tool,
    ...AITools.tools
],

                    // ------------------------------------------------
                    // System instructions
                    // ------------------------------------------------

                    systemInstruction: {

                        parts: [

                            {

                                text:
                                    `
تو یک دستیار فارسی‌زبان دوستانه و مفید هستی.

پاسخ‌ها را طبیعی، کوتاه و واضح بده.

اگر کاربر مستقیماً درخواست تغییر حالت چشم‌های ربات را داد،
باید از ابزار کنترل چشم استفاده کنی.
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


    // ==================================================
    // RETURN TOKEN
    // ==================================================

    return token.name;

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    createVoiceToken

};