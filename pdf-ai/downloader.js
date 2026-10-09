const axios = require("axios");
const fs = require("fs");
const path = require("path");


// مسیر ذخیره PDF های موقت
const TEMP_DIR = path.join(
    __dirname,
    "temp"
);


// ساخت پوشه اگر وجود ندارد
if(!fs.existsSync(TEMP_DIR)){
    fs.mkdirSync(
        TEMP_DIR,
        {
            recursive:true
        }
    );
}



// دانلود PDF
async function downloadPDF(
    fileId,
    pdfUrl
){

    try{


        console.log(
            "⬇️ Download PDF:",
            fileId
        );


        const filePath = path.join(
            TEMP_DIR,
            fileId + ".pdf"
        );



        // اگر قبلا دانلود شده
        if(fs.existsSync(filePath)){


            console.log(
                "📂 PDF already exists"
            );


            return filePath;

        }




        const response = await axios({

            method:"GET",

            url:pdfUrl,

            responseType:"stream"

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
                    reject
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
    downloadPDF
};