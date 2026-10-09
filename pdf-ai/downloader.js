const axios = require("axios");
const fs = require("fs");
const path = require("path");


// ======================================================
// CONFIG
// ======================================================

const API_URL =
    "https://iran-production-d9c4.up.railway.app";


// ======================================================
// TEMP DIRECTORY
// ======================================================

const TEMP_DIR = path.join(
    __dirname,
    "temp"
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
// BUILD PDF URL
// ======================================================

function createPdfUrl(
    fileId,
    source = "telegram"
){


    if(!fileId){

        throw new Error(
            "PDF fileId missing"
        );

    }



    let url;



    if(source === "telegram"){


        url =
        `${API_URL}/api/telegram-files/${fileId}/pdf`;


    }
    else{


        url =
        `${API_URL}/api/files/${fileId}/pdf`;


    }



    console.log(
        "🔗 GENERATED PDF URL:",
        url
    );


    return url;

}




// ======================================================
// DOWNLOAD PDF
// ======================================================

async function downloadPDF(

    fileId,

    pdfUrl = null,

    source = "telegram"

){


    try{


        console.log(
            "⬇️ Download PDF:",
            fileId
        );



        // ساخت لینک اگر وجود ندارد

        if(
            !pdfUrl
        ){

            pdfUrl =
            createPdfUrl(
                fileId,
                source
            );

        }



        if(
            typeof pdfUrl !== "string" ||
            !pdfUrl.startsWith("http")
        ){

            throw new Error(
                "Invalid PDF URL: " + pdfUrl
            );

        }



        console.log(
            "📄 FINAL PDF URL:",
            pdfUrl
        );



        const filePath =
        path.join(
            TEMP_DIR,
            fileId + ".pdf"
        );




        // اگر قبلا دانلود شده

        if(
            fs.existsSync(filePath)
        ){

            console.log(
                "📂 PDF already exists:",
                filePath
            );


            return filePath;

        }




        const response = await axios({

            method:"GET",

            url:pdfUrl,

            responseType:"stream",

            timeout:60000,

            headers:{

                Accept:
                "application/pdf"

            }

        });




        const writer =
        fs.createWriteStream(
            filePath
        );



        response.data.pipe(
            writer
        );




        return new Promise(
            (resolve,reject)=>{


                writer.on(
                    "finish",
                    ()=>{


                        console.log(
                            "✅ PDF saved:",
                            filePath
                        );


                        resolve(
                            filePath
                        );


                    }
                );



                writer.on(
                    "error",
                    (err)=>{

                        console.error(
                            "❌ WRITE PDF ERROR:",
                            err.message
                        );


                        reject(err);

                    }
                );



            }
        );



    }
    catch(error){


        console.error(
            "❌ PDF DOWNLOAD ERROR:",
            error.message
        );


        throw error;


    }


}




module.exports = {

    downloadPdf:
        downloadPDF

};