"use strict";


// ======================================================
// PDF TEXT EXTRACTOR
// خواندن PDF و تبدیل به متن
// ======================================================


const fs = require("fs");
const path = require("path");

const pdfParse = require("pdf-parse");




// ======================================================
// EXTRACT PDF TEXT
// ======================================================

async function extractText(pdfPath){


    try{


        console.log(
            "📖 PDF EXTRACT START:",
            pdfPath
        );



        // ----------------------------------------------
        // بررسی مسیر فایل
        // ----------------------------------------------

        if(!pdfPath){

            throw new Error(
                "PDF path is empty"
            );

        }



        if(!fs.existsSync(pdfPath)){


            throw new Error(
                "PDF file not found: " + pdfPath
            );


        }



        const fileInfo =
            fs.statSync(pdfPath);



        console.log(
            "📦 PDF SIZE:",
            fileInfo.size,
            "bytes"
        );



        if(fileInfo.size === 0){


            throw new Error(
                "PDF file is empty"
            );


        }



        // ----------------------------------------------
        // خواندن فایل
        // ----------------------------------------------

        const buffer =
            fs.readFileSync(
                pdfPath
            );



        console.log(
            "📄 BUFFER READY"
        );





        // ----------------------------------------------
        // استخراج متن
        // ----------------------------------------------

        const result =
            await pdfParse(
                buffer
            );



        const text =
            result.text || "";



        const pages =
            result.numpages || 0;



        console.log(
            "📚 PDF PAGES:",
            pages
        );


        console.log(
            "📝 TEXT LENGTH:",
            text.length
        );





        // ----------------------------------------------
        // PDF بدون متن
        // ----------------------------------------------

        if(!text.trim()){


            console.warn(
                "⚠️ PDF HAS NO EXTRACTABLE TEXT"
            );


        }





        return {


            success:true,


            text:
                text.trim(),


            pages


        };



    }

    catch(error){



        console.error(
            "❌ PDF EXTRACT FAILED:",
            error.message
        );



        return {


            success:false,


            text:"",


            pages:0,


            error:
                error.message


        };


    }


}





module.exports = {


    extractText


};