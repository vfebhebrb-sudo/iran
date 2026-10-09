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




// =====================================================
// GEMINI PDF SESSION CACHE
// =====================================================

const pdfSessions = {};




// =====================================================
// TEMP DIRECTORY
// =====================================================


const TEMP_DIR = path.join(
    __dirname,
    "../temp-files"
);



if(!fs.existsSync(TEMP_DIR)){


    fs.mkdirSync(
        TEMP_DIR,
        {
            recursive:true
        }
    );


}





// =====================================================
// DOWNLOAD PDF
// =====================================================


async function downloadPdf(

    url,

    fileId

){


    const filePath = path.join(

        TEMP_DIR,

        fileId + ".pdf"

    );




    if(
        fs.existsSync(filePath)
    ){

        console.log(
            "📂 USING CACHED PDF"
        );

        return filePath;

    }




    console.log(
        "⬇️ DOWNLOADING PDF:",
        url
    );




    const response =

    await axios({

        method:"GET",

        url,

        responseType:"arraybuffer",

        timeout:60000

    });





    const buffer =

    Buffer.from(
        response.data
    );





    // بررسی واقعی PDF

    const header =

    buffer
    .slice(0,4)
    .toString();



    if(
        header !== "%PDF"
    ){

        throw new Error(
            "Downloaded file is not PDF"
        );

    }





    fs.writeFileSync(

        filePath,

        buffer

    );




    console.log(
        "✅ PDF SAVED:",
        filePath
    );



    return filePath;


}







// =====================================================
// OPEN PDF
// دانلود + آپلود Gemini فقط یک بار
// =====================================================


router.post(
"/open",
async(req,res)=>{


try{


const {


    fileId,

    source="telegram"


}=req.body;





if(!fileId){


return res.status(400).json({

    success:false,

    error:"fileId لازم است"

});


}






const sessionKey =

`${source}_${fileId}`;





// اگر قبلا باز شده

if(
    pdfSessions[sessionKey]
){


return res.json({

    success:true,

    fileName:
    pdfSessions[sessionKey],

    cached:true

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
    "📂 OPEN PDF:",
    {
        fileId,
        source,
        pdfUrl
    }
);







const pdfPath =

await downloadPdf(

    pdfUrl,

    fileId

);








const uploaded =

await uploadPdfToGemini(

    pdfPath

);







pdfSessions[sessionKey] =

uploaded.fileName;







console.log(

"✅ GEMINI SESSION CREATED:",

pdfSessions[sessionKey]

);








return res.json({

    success:true,

    fileName:
    uploaded.fileName

});





}
catch(error){



console.error(

"❌ OPEN PDF ERROR:",

error.message

);



return res.status(500).json({

    success:false,

    error:error.message

});



}


});









// =====================================================
// READ PDF
// فقط سوال بفرست به Gemini
// =====================================================


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







const sessionKey =

`${source}_${fileId}`;







const geminiFile =

pdfSessions[sessionKey];







if(!geminiFile){


return res.status(400).json({

success:false,

error:
"PDF باز نشده است. ابتدا open_pdf اجرا شود."

});


}







console.log(

"🧠 ASK GEMINI PDF:",

{

fileId,

geminiFile,

question

}

);








const answer =

await askGeminiFile(

    geminiFile,

    question

);







return res.json({

success:true,

reply:

answer.answer || answer

});







}
catch(error){



console.error(

"❌ READ PDF ERROR:",

error.message

);




return res.status(500).json({

success:false,

error:error.message

});



}


});







module.exports = router;