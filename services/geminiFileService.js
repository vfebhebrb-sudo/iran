"use strict";


// ======================================================
// GEMINI FILE SERVICE
// Upload PDF -> Gemini Files API
// مدیریت فایل PDF خارج از سرور خودمان
// ======================================================


const {
    GoogleGenAI
} = require("@google/genai");



const fs = require("fs");





const ai = new GoogleGenAI({

    apiKey:
    process.env.GEMINI_API_KEY

});





// ======================================================
// UPLOAD PDF TO GEMINI
// ======================================================


async function uploadPdfToGemini(

    filePath

){

    try{


        console.log(
            "📤 Upload PDF to Gemini:",
            filePath
        );



        if(
            !fs.existsSync(filePath)
        ){

            throw new Error(
                "PDF file not found"
            );

        }





        const uploadResult =

        await ai.files.upload({

            file:

            filePath,


            config:{

                mimeType:
                "application/pdf"

            }

        });





        if(
            !uploadResult.name
        ){

            throw new Error(
                "Gemini file upload failed"
            );

        }





        console.log(
            "✅ GEMINI FILE CREATED:",
            uploadResult.name
        );





        return {

            success:true,

            fileName:
            uploadResult.name

        };



    }

    catch(error){


        console.error(

            "❌ GEMINI FILE UPLOAD ERROR:",

            error.message

        );


        throw error;


    }


}




// ======================================================
// ASK QUESTION FROM GEMINI PDF FILE
// ======================================================

async function askGeminiFile(
    fileName,
    question
){

    try{

        console.log(
            "📚 ASK GEMINI FILE:",
            fileName
        );


        const result =

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
تو یک دستیار مطالعه هستی.

بر اساس فایل PDF پاسخ بده.

اگر جواب داخل فایل نبود بگو پیدا نشد.


سوال کاربر:

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
            result.text

        };


    }

    catch(error){


        console.error(

            "❌ GEMINI FILE QUESTION ERROR:",

            error.message

        );


        throw error;

    }

}




// ======================================================
// ASK QUESTION FROM PDF
// ======================================================


async function askGeminiPdf(

    geminiFile,

    question

){

    try{


        console.log(

            "📚 ASK GEMINI PDF:",

            geminiFile

        );





        const result =

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
                                geminiFile,


                                mimeType:
                                "application/pdf"


                            }

                        },


                        {


                            text:

`
تو یک دستیار مطالعه هستی.

بر اساس فایل PDF پاسخ بده.

اگر جواب داخل فایل نبود بگو پیدا نشد.


سوال:

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

            result.text


        };



    }

    catch(error){


        console.error(

            "❌ GEMINI PDF QUESTION ERROR:",

            error.message

        );


        throw error;


    }


}





module.exports = {

    uploadPdfToGemini,

    askGeminiFile

};