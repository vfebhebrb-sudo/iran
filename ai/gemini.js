const {
    GoogleGenerativeAI
}
=
require("@google/generative-ai");



const genAI =
new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);




// =================================================
// GEMINI MODEL POOL
// =================================================
// =================================================
// GEMINI MODEL POOL
// =================================================


const models = [


    {
        name:"gemini-3.5-flash-lite",

        model:
        genAI.getGenerativeModel({
            model:"gemini-3.5-flash-lite"
        })
    },



    {
        name:"gemini-2.0-flash",

        model:
        genAI.getGenerativeModel({
            model:"gemini-2.0-flash"
        })
    },



    {
        name:"gemini-2.0-flash-lite",

        model:
        genAI.getGenerativeModel({
            model:"gemini-2.0-flash-lite"
        })
    },



    {
        name:"gemini-1.5-flash",

        model:
        genAI.getGenerativeModel({
            model:"gemini-1.5-flash"
        })
    },



    {
        name:"gemini-1.5-flash-8b",

        model:
        genAI.getGenerativeModel({
            model:"gemini-1.5-flash-8b"
        })
    }


];





// =================================================
// SMART MODEL SELECTOR
// =================================================


async function generateWithAnyModel(prompt){



    for(
        const item of models
    ){



        try{


            console.log(
                "🧠 TRY GEMINI MODEL:",
                item.name
            );



            const result =
            await item.model.generateContent(
                prompt
            );



            const text =
            result.response.text();



            if(text){


                console.log(
                    "✅ USING MODEL:",
                    item.name
                );



                return text;


            }



        }

        catch(error){


            console.log(

                "❌ MODEL FAILED:",
                item.name,

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
// TEXT AI
// =================================================


async function askGemini(text){


    return await generateWithAnyModel(text);


}









// =================================================
// PDF AI
// =================================================


async function askGeminiPdf(
    pdfBuffer,
    prompt
){


    for(
        const item of models
    ){


        try{


            console.log(
                "📄 TRY PDF MODEL:",
                item.name
            );



            const result =
            await item.model.generateContent([



                {
                    text:prompt
                },



                {

                    inlineData:{


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
                "PDF MODEL FAILED:",
                item.name
            );


        }



    }



    return null;


}









module.exports = askGemini;


module.exports.askGeminiPdf =
askGeminiPdf;