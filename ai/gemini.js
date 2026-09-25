const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite"
});


// =======================================
// TEXT GEMINI
// =======================================

async function askGemini(text){

    try{

        const result =
            await model.generateContent(text);

        return result.response.text();

    }

    catch(error){

        console.log(
            "GEMINI ERROR:",
            error.message
        );

        return "❌ الان هوش مصنوعی در دسترس نیست.";

    }

}


// =======================================
// PDF GEMINI
// =======================================

async function askGeminiPdf(
    pdfBuffer,
    prompt
){

    try{

        const result =
            await model.generateContent([

                {
                    text: prompt
                },

                {
                    inlineData: {

                        mimeType:
                            "application/pdf",

                        data:
                            pdfBuffer.toString("base64")

                    }

                }

            ]);


        return result.response.text();

    }

    catch(error){

        console.log(
            "GEMINI PDF ERROR:",
            error.message
        );

        return "❌ الان هوش مصنوعی در دسترس نیست.";

    }

}


// =======================================
// EXPORT
// =======================================

module.exports = askGemini;

module.exports.askGeminiPdf =
    askGeminiPdf;