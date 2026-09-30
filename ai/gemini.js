const {
    GoogleGenerativeAI
} = require("@google/generative-ai");

const Anthropic =
    require("@anthropic-ai/sdk");



// =================================================
// API CLIENTS
// =================================================

const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );


const anthropic =
    new Anthropic({
        apiKey:
            process.env.CLAUDE_API_KEY
    });



// =================================================
// GEMINI MODEL POOL
// =================================================

const geminiModels = [

    {
        name: "gemini-3.5-flash-lite",

        model:
            genAI.getGenerativeModel({
                model: "gemini-3.5-flash-lite"
            })
    },

    {
        name: "gemini-2.0-flash",

        model:
            genAI.getGenerativeModel({
                model: "gemini-2.0-flash"
            })
    },

    {
        name: "gemini-2.0-flash-lite",

        model:
            genAI.getGenerativeModel({
                model: "gemini-2.0-flash-lite"
            })
    }

];



// =================================================
// CLAUDE MODEL POOL
// =================================================

const claudeModels = [

    {
        name: "claude-sonnet-5"
    },

    {
        name: "claude-opus-5"
    },

    {
        name: "claude-haiku-4-5"
    }

];



// =================================================
// GEMINI TEXT
// =================================================

async function generateWithGemini(prompt) {

    for (
        const item of geminiModels
    ) {

        try {

            console.log(
                "🟢 TRY GEMINI:",
                item.name
            );


            const result =
                await item.model.generateContent(
                    prompt
                );


            const text =
                result.response.text();


            if (text) {

                console.log(
                    "✅ GEMINI USING:",
                    item.name
                );

                return text;

            }

        }

        catch (error) {

            console.log(
                "❌ GEMINI FAILED:",
                item.name,
                error.message
            );

        }

    }


    return null;

}



// =================================================
// CLAUDE TEXT
// =================================================

async function generateWithClaude(prompt) {

    for (
        const item of claudeModels
    ) {

        try {

            console.log(
                "🟣 TRY CLAUDE:",
                item.name
            );


            const message =
                await anthropic.messages.create({

                    model:
                        item.name,

                    max_tokens:
                        4096,

                    messages: [

                        {
                            role: "user",

                            content: prompt
                        }

                    ]

                });


            const text =
                message.content
                    .filter(
                        block =>
                            block.type === "text"
                    )
                    .map(
                        block =>
                            block.text
                    )
                    .join("\n");


            if (text) {

                console.log(
                    "✅ CLAUDE USING:",
                    item.name
                );

                return text;

            }

        }

        catch (error) {

            console.log(
                "❌ CLAUDE FAILED:",
                item.name,
                error.message
            );

        }

    }


    return null;

}



// =================================================
// SMART TEXT AI
// =================================================
//
// اول Gemini
// اگر همه Gemini ها شکست خوردند
// Claude امتحان می شود
//

async function askGemini(text) {


    const geminiResult =
        await generateWithGemini(
            text
        );


    if (geminiResult) {

        return geminiResult;

    }


    console.log(
        "⚠️ ALL GEMINI MODELS FAILED"
    );


    console.log(
        "🔄 SWITCHING TO CLAUDE..."
    );


    const claudeResult =
        await generateWithClaude(
            text
        );


    if (claudeResult) {

        return claudeResult;

    }


    console.log(
        "🚨 ALL AI MODELS FAILED"
    );


    return null;

}



// =================================================
// GEMINI PDF
// =================================================

async function generatePdfWithGemini(
    pdfBuffer,
    prompt
) {

    for (
        const item of geminiModels
    ) {

        try {

            console.log(
                "📄 TRY GEMINI PDF:",
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


            const text =
                result.response.text();


            if (text) {

                console.log(
                    "✅ GEMINI PDF USING:",
                    item.name
                );

                return text;

            }

        }

        catch (error) {

            console.log(
                "❌ GEMINI PDF FAILED:",
                item.name,
                error.message
            );

        }

    }


    return null;

}



// =================================================
// CLAUDE PDF
// =================================================

async function generatePdfWithClaude(
    pdfBuffer,
    prompt
) {

    for (
        const item of claudeModels
    ) {

        try {

            console.log(
                "📄 TRY CLAUDE PDF:",
                item.name
            );


            const message =
                await anthropic.messages.create({

                    model:
                        item.name,

                    max_tokens:
                        4096,

                    messages: [

                        {

                            role: "user",

                            content: [

                                {

                                    type:
                                        "document",

                                    source: {

                                        type:
                                            "base64",

                                        media_type:
                                            "application/pdf",

                                        data:
                                            pdfBuffer.toString(
                                                "base64"
                                            )

                                    }

                                },

                                {

                                    type:
                                        "text",

                                    text:
                                        prompt

                                }

                            ]

                        }

                    ]

                });


            const text =
                message.content
                    .filter(
                        block =>
                            block.type === "text"
                    )
                    .map(
                        block =>
                            block.text
                    )
                    .join("\n");


            if (text) {

                console.log(
                    "✅ CLAUDE PDF USING:",
                    item.name
                );

                return text;

            }

        }

        catch (error) {

            console.log(
                "❌ CLAUDE PDF FAILED:",
                item.name,
                error.message
            );

        }

    }


    return null;

}



// =================================================
// SMART PDF AI
// =================================================
//
// اول Gemini
// اگر شکست خورد → Claude
//

async function askGeminiPdf(
    pdfBuffer,
    prompt
) {


    const geminiResult =
        await generatePdfWithGemini(
            pdfBuffer,
            prompt
        );


    if (geminiResult) {

        return geminiResult;

    }


    console.log(
        "⚠️ ALL GEMINI PDF MODELS FAILED"
    );


    console.log(
        "🔄 SWITCHING PDF TO CLAUDE..."
    );


    const claudeResult =
        await generatePdfWithClaude(
            pdfBuffer,
            prompt
        );


    if (claudeResult) {

        return claudeResult;

    }


    console.log(
        "🚨 ALL PDF AI MODELS FAILED"
    );


    return null;

}



// =================================================
// EXPORTS
// =================================================

module.exports =
    askGemini;


module.exports.askGeminiPdf =
    askGeminiPdf;