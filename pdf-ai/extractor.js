"use strict";


// ======================================================
// PDF TEXT EXTRACTOR
// Deprecated
// PDF processing moved to Gemini File API
// ======================================================



async function extractText(pdfPath){


    console.warn(
        "⚠️ extractText called but PDF extraction is disabled."
    );


    console.warn(
        "⚠️ Use Gemini File API instead."
    );



    return {


        success:false,


        text:"",


        pages:0,


        error:
        "Local PDF extraction disabled. Use Gemini File API."


    };


}




module.exports = {


    extractText


};