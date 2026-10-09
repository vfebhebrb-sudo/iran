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

    pdfUrl

}){


    try{


        console.log(
            "🚀 PDF PROCESS START:",
            fileId
        );



        // ==============================
        // 1) DOWNLOAD PDF
        // ==============================


        const pdfPath =
            await downloadPdf(
                fileId,
                pdfUrl
            );



        console.log(
            "📥 PDF PATH:",
            pdfPath
        );



        // ==============================
        // 2) EXTRACT TEXT
        // ==============================


        const extracted =
            await extractText(
                pdfPath
            );



        console.log(
            "📄 EXTRACT DONE:",
            extracted.pages,
            "pages"
        );



        // ==============================
        // 3) PROCESS TEXT
        // ==============================


        const processed =
            processText(
                extracted.text
            );



        console.log(
            "⚙️ TEXT PROCESS DONE:",
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
            "❌ PDF PROCESS ERROR:",
            error.message
        );



        return {


            success:false,


            error:
            error.message


        };


    }


}





// ======================================================
// EXPORTS
// ======================================================


module.exports = {


    downloadPdf,

    extractText,

    processText,

    processPDF


};