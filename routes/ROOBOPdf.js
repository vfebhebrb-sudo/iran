"use strict";


const express = require("express");

const router = express.Router();

const {
    processPDF
} = require("../pdf-ai/pdfEngine");

const {
    askPdfGemini
} =
require("../services/pdfGemini");



// ======================================================
// READ PDF
// ======================================================


router.post(
"/read",
async(req,res)=>{


    try{


        const {

            fileId,

            source,

            question


        } = req.body;




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

        process.env.SERVER_URL ||

        "https://iran-production-d9c4.up.railway.app";





        let pdfUrl;





        if(source==="telegram"){


            pdfUrl =

            `${API}/api/telegram-files/${fileId}/pdf`;


        }

        else{


            pdfUrl =

            `${API}/api/files/${fileId}/pdf`;


        }





        console.log(
            "📚 PDF AI REQUEST"
        );


        console.log(
            "FILE:",
            fileId
        );


        console.log(
            "URL:",
            pdfUrl
        );







        // ===============================
        // پردازش PDF
        // ===============================


        const pdf =

        await processPDF({


            fileId,

            pdfUrl


        });






        if(!pdf.success){


            return res.status(500).json({


                success:false,

                error:
                pdf.error


            });


        }





        // فعلاً تست استخراج متن

const answer =

await askPdfGemini(

    pdf.text,

    question

);



return res.json({

    success:true,

    reply:answer

});






    }

    catch(error){


        console.error(

            "❌ READ PDF ERROR:",

            error

        );



        res.status(500).json({


            success:false,

            error:error.message


        });


    }



});





module.exports = router;