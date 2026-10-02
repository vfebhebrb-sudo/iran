
const {
    GoogleGenerativeAI
}
=
require("@google/generative-ai");


// =================================================
// GEMINI CLIENT
// =================================================

const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );


// =================================================
// GEMINI MODEL POOL
// =================================================

const MODEL_NAMES = [

    "gemini-3.5-flash-lite",

    "gemini-2.5-flash",

    "gemini-2.5-flash-lite",

    "gemini-2.0-flash",

    "gemini-2.0-flash-lite",

    "gemini-1.5-flash",

    "gemini-1.5-flash-8b"

];


const models =
    MODEL_NAMES.map(
        name => ({

            name,

            model:
                genAI.getGenerativeModel({
                    model: name
                })

        })
    );


// =================================================
// TEXT AI
// =================================================

async function askGemini(text) {

    for (
        const item of models
    ) {

        try {

            console.log(
                "🧠 TRY GEMINI MODEL:",
                item.name
            );


            const result =
                await item.model.generateContent(
                    text
                );


            const output =
                result.response.text();


            if (
                output &&
                output.trim()
            ) {

                console.log(
                    "✅ USING GEMINI MODEL:",
                    item.name
                );


                return output;

            }

        }

        catch (error) {

            console.log(
                "❌ GEMINI MODEL FAILED:",
                item.name
            );

            console.log(
                "   ERROR:",
                error.message
            );

        }

    }


    console.log(
        "🚨 ALL GEMINI MODELS FAILED"
    );


    return null;

}


// =================================================
// PDF AI
// =================================================

async function askGeminiPdf(
    pdfBuffer,
    prompt
) {

    for (
        const item of models
    ) {

        try {

            console.log(
                "📄 TRY GEMINI PDF MODEL:",
                item.name
            );


            const result =
                await item.model.generateContent([

                    {
                        text: prompt
                    },

                    {
                        inlineData: {

                            mimeType:
                                "application/pdf",

                            data:
                                pdfBuffer.toString(
                                    "base64"
                                )

                        }

                    }

                ]);


            const output =
                result.response.text();


            if (
                output &&
                output.trim()
            ) {

                console.log(
                    "✅ USING GEMINI PDF MODEL:",
                    item.name
                );


                return output;

            }

        }

        catch (error) {

            console.log(
                "❌ GEMINI PDF MODEL FAILED:",
                item.name
            );

            console.log(
                "   ERROR:",
                error.message
            );

        }

    }


    console.log(
        "🚨 ALL GEMINI PDF MODELS FAILED"
    );


    return null;

}


// =================================================
// EXPORT
// =================================================

module.exports =
    askGemini;


module.exports.askGeminiPdf =
    askGeminiPdf;
