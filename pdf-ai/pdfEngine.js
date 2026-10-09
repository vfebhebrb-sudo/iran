"use strict";


// ======================================================
// PDF ENGINE
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
            "🚀 PDF ENGINE START:",
            fileId
        );





        // ==================================================
        // 1 - DOWNLOAD
        // ==================================================


        const pdfPath =
            await downloadPdf({

                fileId,

                pdfUrl,

                source

            });



        console.log(
            "📥 PDF DOWNLOADED:",
            pdfPath
        );





        // ==================================================
        // 2 - EXTRACT TEXT
        // ==================================================


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
            "📄 PDF TEXT READY:",
            extracted.pages,
            "pages"
        );






        // ==================================================
        // 3 - PROCESS TEXT
        // ==================================================


        const processed =
            processText(
                extracted.text
            );



        if(
            !processed.success
        ){


            throw new Error(
                "PDF text processing failed"
            );


        }






        console.log(
            "🧠 PDF READY:",
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
            "❌ PDF ENGINE ERROR:",
            error.message
        );



        return {


            success:false,


            fileId,


            error:
                error.message



        };


    }


}







module.exports = {


    processPDF


};