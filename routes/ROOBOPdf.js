"use strict";


const express = require("express");

const router = express.Router();


const {
    processPDF
} = require("../pdf-ai/pdfEngine");


const {
    askPdfGemini
} = require("../services/pdfGemini");





router.post(
"/read",
async(req,res)=>{


    try{


        const {

            fileId,
            source="telegram",
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

        process.env.API_URL ||

        "https://iran-go4q.onrender.com";





        const pdfUrl =

        source==="telegram"

        ?

        `${API}/api/telegram-files/${fileId}/pdf`

        :

        `${API}/api/files/${fileId}/pdf`;






        console.log(
            "📚 READ PDF START"
        );


        console.log(
            {
                fileId,
                source,
                pdfUrl
            }
        );






        const pdf =

        await processPDF({

            fileId,

            pdfUrl,

            source

        });






        if(
            !pdf.success
        ){

            throw new Error(
                pdf.error ||
                "PDF processing failed"
            );

        }





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

            error.message

        );



        return res.status(500).json({

            success:false,

            error:error.message

        });


    }


});




module.exports = router;