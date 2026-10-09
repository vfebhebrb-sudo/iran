"use strict";


// ======================================================
// PDF ENGINE
// Gemini File API Bridge
// ======================================================


const {

    uploadPdfToGemini,

    askGeminiFile

} = require("../services/geminiFileService");





// ======================================================
// PROCESS PDF WITH GEMINI
// ======================================================


async function processPDF({


    filePath,

    question


}){


    try{


        console.log(
            "🚀 GEMINI PDF ENGINE START"
        );



        if(
            !filePath
        ){

            throw new Error(
                "PDF file path missing"
            );

        }




        // ==================================================
        // 1 - UPLOAD FILE TO GEMINI
        // ==================================================


        const uploaded =

            await uploadPdfToGemini(
                filePath
            );



        if(
            !uploaded.success
        ){

            throw new Error(
                uploaded.error ||
                "Gemini upload failed"
            );

        }




        console.log(

            "📤 GEMINI FILE:",
            uploaded.fileName

        );





        // ==================================================
        // 2 - ASK GEMINI ABOUT FILE
        // ==================================================


        const answer =

            await askGeminiFile(

                uploaded.fileName,

                question

            );





        console.log(

            "🧠 GEMINI PDF ANSWER READY"

        );






        return {


            success:true,


            fileName:
                uploaded.fileName,


            reply:
                answer



        };





    }


    catch(error){



        console.error(

            "❌ GEMINI PDF ENGINE ERROR:",
            error.message

        );



        return {


            success:false,


            error:
                error.message



        };



    }



}




module.exports = {


    processPDF


};