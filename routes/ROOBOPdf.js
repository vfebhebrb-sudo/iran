

"use strict";


const express = require("express");

const router = express.Router();



const {

    uploadPdfToGemini,

    askGeminiFile

} = require("../services/geminiFileService");



const axios = require("axios");

const fs = require("fs");

const path = require("path");




// =============================================
// TEMP DIRECTORY
// =============================================


const TEMP_DIR = path.join(
    __dirname,
    "../temp-files"
);





// =============================================
// GET PDF FILE
// =============================================


async function downloadPdf(url,fileId){


    const filePath = path.join(

        TEMP_DIR,

        fileId + ".pdf"

    );



    if(
        fs.existsSync(filePath)
    ){

        return filePath;

    }




    const response = await axios({

        method:"GET",

        url,

        responseType:"stream",

        timeout:60000

    });





    const writer =
    fs.createWriteStream(
        filePath
    );



    response.data.pipe(writer);




    return new Promise(
        (resolve,reject)=>{


            writer.on(
                "finish",
                ()=>resolve(filePath)
            );


            writer.on(
                "error",
                reject
            );


        }
    );



}







// =============================================
// READ PDF WITH GEMINI FILE API
// =============================================


router.post(
"/read",
async(req,res)=>{


try{


const {


    fileId,

    source="telegram",

    question


}=req.body;




if(
    !fileId ||
    !question
){


return res.status(400).json({

    success:false,

    error:
    "fileId و question لازم است"

});


}







const API =

process.env.API_URL ||

"https://iran-go4q.up.railway.app";







const pdfUrl =

source==="telegram"

?

`${API}/api/telegram-files/${fileId}/pdf`

:

`${API}/api/files/${fileId}/pdf`;







console.log(
    "📚 GEMINI PDF READ START"
);


console.log({

    fileId,

    source,

    pdfUrl

});







// =====================================
// 1) DOWNLOAD TEMP PDF
// =====================================


const pdfPath =

await downloadPdf(

    pdfUrl,

    fileId

);




console.log(

"📥 PDF DOWNLOADED:",

pdfPath

);








// =====================================
// 2) UPLOAD TO GEMINI FILE API
// =====================================


const uploaded =

await uploadPdfToGemini(

    pdfPath

);




console.log(

"✅ GEMINI FILE:",

uploaded.fileName

);








// =====================================
// 3) ASK GEMINI DIRECTLY
// =====================================


const answer =

await askGeminiFile(

    uploaded.fileName,

    question

);








return res.json({

    success:true,

    reply:answer,

    file:
    uploaded.fileName

});






}
catch(error){


console.error(

"❌ GEMINI PDF READ ERROR:",

error

);



return res.status(500).json({

    success:false,

    error:error.message

});



}


});








module.exports = router;
