"use strict";


// ======================================================
// GEMINI FILE SERVICE
// PDF -> Gemini File API
// ======================================================


const {
    GoogleGenAI
} = require("@google/genai");


const fs = require("fs");



const ai = new GoogleGenAI({

    apiKey:
    process.env.GEMINI_API_KEY

});




// حافظه موقت فایل‌های Gemini

const geminiFiles = {};





// ======================================================
// UPLOAD PDF
// ======================================================


async function uploadPdfToGemini(filePath){


    try{


        console.log(
            "📤 UPLOAD PDF:",
            filePath
        );



        if(
            !fs.existsSync(filePath)
        ){

            throw new Error(
                "PDF not found"
            );

        }



        const uploaded =

        await ai.files.upload({

            file:filePath,

            config:{

                mimeType:
                "application/pdf"

            }

        });



        if(
            !uploaded.name
        ){

            throw new Error(
                "Gemini upload failed"
            );

        }



        console.log(

            "✅ GEMINI FILE:",
            uploaded.name

        );



        return {


            success:true,


            fileName:
            uploaded.name



        };


    }

    catch(error){


        console.error(

            "UPLOAD ERROR:",
            error.message

        );


        throw error;


    }


}





// ======================================================
// ASK GEMINI FILE
// ======================================================


async function askGeminiFile(

    fileName,

    question

){


    try{


        console.log(

            "🧠 ASK FILE:",
            fileName

        );




        const response =

        await ai.models.generateContent({

            model:

            "gemini-2.0-flash",



            contents:[


                {

                    role:"user",


                    parts:[


                        {

                            fileData:{


                                fileUri:
                                fileName,


                                mimeType:
                                "application/pdf"


                            }

                        },


                        {

                            text:

`
تو یک دستیار مطالعه فارسی هستی.

قوانین:

- فقط بر اساس PDF جواب بده.
- اگر جواب داخل فایل نبود بگو پیدا نشد.
- پاسخ کوتاه و دقیق بده.


سؤال:

${question}

`

                        }


                    ]

                }


            ]


        });





        return {


            success:true,


            answer:
            response.text



        };



    }

    catch(error){


        console.error(

            "ASK GEMINI ERROR:",
            error.message

        );


        throw error;


    }


}





module.exports={


    uploadPdfToGemini,


    askGeminiFile


};