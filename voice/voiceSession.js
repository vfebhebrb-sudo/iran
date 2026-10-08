const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


async function createVoiceToken() {

    const now =
        Date.now();


    const expireTime =
        new Date(
            now + 30 * 60 * 1000
        ).toISOString();


    const newSessionExpireTime =
        new Date(
            now + 60 * 1000
        ).toISOString();


    const token =
        await ai.authTokens.create({

            config: {

                uses: 1,

                expireTime:
                    expireTime,

                newSessionExpireTime:
                    newSessionExpireTime,

                bidiGenerateContentSetup: {

                    model:
                        "models/gemini-3.8-live",

                    responseModalities: [
                        "AUDIO"
                    ],

                    systemInstruction: {

                        parts: [

                            {
                                text:
                                    "تو یک دستیار فارسی‌زبان دوستانه و مفید هستی. پاسخ‌ها را طبیعی، کوتاه و واضح بده."
                            }

                        ]

                    }

                }

            }

        });


    return token.name;

}


module.exports = {
    createVoiceToken
};