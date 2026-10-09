"use strict";


// ======================================================
// PDF DOWNLOADER
// Deprecated
// PDF handling moved to Gemini File API
// ======================================================



async function downloadPdf(
    fileId,
    pdfUrl = null,
    source = "telegram"
){


    console.warn(
        "⚠️ downloadPdf called but local PDF download is disabled."
    );


    console.warn(
        "⚠️ Use Gemini File API upload instead."
    );



    return {


        success:false,


        error:
        "Local PDF download disabled. Use Gemini File API."


    };


}



module.exports = {


    downloadPdf


};