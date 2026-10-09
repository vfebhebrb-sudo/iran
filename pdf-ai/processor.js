"use strict";


// ======================================================
// PDF TEXT PROCESSOR
// Deprecated
// Gemini File API handles PDF processing now
// ======================================================



function processText(text){


    console.warn(
        "⚠️ processText called."
    );


    console.warn(
        "⚠️ Local PDF text processing disabled."
    );



    return {


        success:false,


        text:"",


        chunks:[],


        error:
        "PDF text processing disabled. Use Gemini File API."



    };


}



module.exports = {


    processText


};