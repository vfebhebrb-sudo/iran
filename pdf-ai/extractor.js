// ======================================================
// PDF EXTRACTOR
// تبدیل PDF به متن
// ======================================================


const fs = require("fs");
const pdfParse = require("pdf-parse");





// ======================================================
// EXTRACT TEXT FROM PDF
// ======================================================


async function extractText(pdfPath){


    try{


        console.log(
            "📖 Extracting PDF:",
            pdfPath
        );



        if(!fs.existsSync(pdfPath)){


            throw new Error(
                "PDF file not found"
            );


        }




        const buffer = fs.readFileSync(
            pdfPath
        );




        const data = await pdfParse(
            buffer
        );




        const text =
            data.text || "";




        console.log(
            "📄 TEXT LENGTH:",
            text.length
        );




        if(!text.trim()){


            console.warn(
                "⚠️ PDF has no text"
            );


        }




        return {

            text,

            pages:
            data.numpages || 0

        };



    }
    catch(error){


        console.error(

            "❌ PDF EXTRACT ERROR:",

            error.message

        );


        throw error;


    }


}




module.exports = {

    extractText

};