"use strict";


// ======================================================
// PDF AI ENGINE
// Downloader + Extractor + Processor
// ======================================================


const {
    downloadPdf
} = require("./downloader");


const {
    extractText
} = require("./extractor");


const {
    processText
} = require("./processor");





// ======================================================
// PROCESS COMPLETE PDF
// ======================================================


async function processPDF({

    fileId,

    pdfUrl,

    source = "telegram"

}){


    try{


        console.log(
            "🚀 PDF PROCESS START:",
            fileId
        );




        // ==============================
        // DOWNLOAD
        // ==============================


        const pdfPath =
            await downloadPdf(

                fileId,

                pdfUrl,

                source

            );



        console.log(
            "📥 PDF PATH:",
            pdfPath
        );





        // ==============================
        // EXTRACT TEXT
        // ==============================


        const extracted =
            await extractText(

                pdfPath

            );



        if(
            !extracted.success
        ){

            throw new Error(
                extracted.error ||
                "PDF extract failed"
            );

        }




        console.log(

            "📄 EXTRACT DONE:",

            extracted.pages,

            "pages"

        );







        // ==============================
        // PROCESS TEXT
        // ==============================


        const processed =
            processText(

                extracted.text

            );



        if(
            !processed.success
        ){

            throw new Error(
                "Text processing failed"
            );

        }





        console.log(

            "⚙️ TEXT PROCESS DONE:",

            processed.chunks.length,

            "chunks"

        );






        return {


            success:true,


            fileId,


            source,


            pages:
                extracted.pages,


            text:
                processed.text,


            chunks:
                processed.chunks


        };



    }


    catch(error){


        console.error(

            "❌ PDF PROCESS ERROR:",

            error.message

        );



        return {


            success:false,


            fileId,


            error:
                error.message,


            text:"",


            chunks:[]

        };


    }


}





module.exports = {


    processPDF


};