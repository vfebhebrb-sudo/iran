// ======================================================
// PDF AI ENGINE
// اتصال Downloader + Extractor + Processor
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

    pdfUrl

}){


    try{


        console.log(
            "🚀 PDF PROCESS START:",
            fileId
        );



        // 1) دانلود PDF

        const pdfPath =
            await downloadPdf({

                fileId,

                pdfUrl

            });





        // 2) استخراج متن

        const extracted =
            await extractText(
                pdfPath
            );






        // 3) پردازش متن

        const processed =
            processText(
                extracted.text
            );





        console.log(
            "✅ PDF PROCESS COMPLETE"
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






module.exports = {


    processPDF


};