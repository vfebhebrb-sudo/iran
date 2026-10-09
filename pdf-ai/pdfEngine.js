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
// PROCESS PDF
// ======================================================


async function processPDF({

    fileId,

    pdfUrl,

    source = "telegram"

}) {


    try {


        console.log(
            "🚀 PDF ENGINE START:",
            fileId
        );



        // -------------------------------
        // 1. DOWNLOAD
        // -------------------------------


        const pdfPath =

        await downloadPdf(

            fileId,

            pdfUrl,

            source

        );



        console.log(
            "📥 PDF DOWNLOADED:",
            pdfPath
        );





        // -------------------------------
        // 2. EXTRACT TEXT
        // -------------------------------


        const extracted =

        await extractText(

            pdfPath

        );



        console.log(

            "📄 TEXT EXTRACTED:",

            extracted.pages,

            "pages"

        );





        // -------------------------------
        // 3. PROCESS TEXT
        // -------------------------------


        const processed =

        processText(

            extracted.text

        );



        console.log(

            "🧠 PDF READY:",

            processed.chunks.length,

            "chunks"

        );




        return {


            success:true,


            fileId,


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



        throw error;


    }


}





module.exports = {


    processPDF


};