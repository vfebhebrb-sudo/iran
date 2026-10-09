"use strict";


const axios = require("axios");
const fs = require("fs");
const path = require("path");



// ======================================================
// CONFIG
// ======================================================


const API_URL =
    process.env.API_URL ||
    "https://iran-go4q.onrender.com";




// ======================================================
// TEMP DIRECTORY
// ======================================================


const TEMP_DIR =
    path.join(
        __dirname,
        "../../temp-files"
    );



if(!fs.existsSync(TEMP_DIR)){

    fs.mkdirSync(
        TEMP_DIR,
        {
            recursive:true
        }
    );

}




// ======================================================
// CREATE PDF URL
// ======================================================


function createPdfUrl(
    fileId,
    source="telegram"
){


    if(!fileId){

        throw new Error(
            "fileId missing"
        );

    }



    if(source==="telegram"){

        return (
            API_URL +
            "/api/telegram-files/" +
            fileId +
            "/pdf"
        );

    }



    return (
        API_URL +
        "/api/files/" +
        fileId +
        "/pdf"
    );

}




// ======================================================
// DOWNLOAD PDF
// ======================================================


async function downloadPdf(
    fileId,
    pdfUrl=null,
    source="telegram"
){


    try{


        console.log(
            "⬇️ DOWNLOAD PDF:",
            fileId
        );



        if(!pdfUrl){

            pdfUrl =
            createPdfUrl(
                fileId,
                source
            );

        }



        console.log(
            "🔗 PDF URL:",
            pdfUrl
        );




        const filePath =
        path.join(
            TEMP_DIR,
            `${fileId}.pdf`
        );




        if(
            fs.existsSync(filePath)
        ){

            console.log(
                "📂 Using cached PDF"
            );

            return filePath;

        }





        const response =
        await axios({

            method:"GET",

            url:pdfUrl,

            responseType:"arraybuffer",

            timeout:60000,

            validateStatus:(status)=>{

                return status >=200 &&
                       status <300;

            }

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



        if(header !== "%PDF"){

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
    catch(error){


        console.error(
            "❌ DOWNLOAD PDF ERROR:",
            error.message
        );


        throw error;

    }


}





module.exports={


    downloadPdf

};