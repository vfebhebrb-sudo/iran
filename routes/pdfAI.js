const express = require("express");
const router = express.Router();



// ======================================================
// PDF AI ENGINE
// ======================================================


const {
    processPDF
} = require("../pdf-ai");





// ======================================================
// TEMP PDF MEMORY
// بعداً انتقال به MongoDB
// ======================================================


const pdfSessions = {};






// ======================================================
// ASK PDF
// ======================================================


router.post(
"/ask",
async (req,res)=>{


    try{


        const {

            question,

            fileId,

            sessionId


        } = req.body;





        if(!question){


            return res.json({

                success:false,

                error:
                "Question required"

            });


        }





        if(!fileId){


            return res.json({

                success:false,

                error:
                "PDF fileId missing"

            });


        }






        console.log(
            "📚 PDF QUESTION:",
            question
        );



        console.log(
            "📄 FILE ID:",
            fileId
        );









        // ==================================================
        // CHECK CACHE
        // ==================================================


        let pdfData =
            pdfSessions[fileId];








        // ==================================================
        // PROCESS PDF IF NEEDED
        // ==================================================


        if(!pdfData){



            console.log(
                "⚙️ PDF PROCESS START..."
            );





            const pdfUrl =

                `${process.env.API_URL}/api/files/${fileId}/pdf`;







            const processed =

                await processPDF({

                    fileId,

                    pdfUrl

                });







            if(!processed.success){


                return res.json({

                    success:false,

                    error:
                    "PDF processing failed",


                    details:
                    processed.error


                });


            }









            pdfSessions[fileId]={


                pages:

                processed.pages,



                text:

                processed.text,



                chunks:

                processed.chunks,



                createdAt:

                new Date()


            };








            pdfData =

                pdfSessions[fileId];






            console.log(

                "✅ PDF READY:",

                fileId

            );



        }









        // ==================================================
        // SEARCH PDF
        // ==================================================


        const answer =

            await searchPdf(

                pdfData,

                question

            );








        return res.json({

            success:true,


            ready:true,


            answer,



            sessionId:

                sessionId ||

                fileId



        });





    }
    catch(error){


        console.error(

            "❌ PDF AI ERROR:",

            error

        );



        return res.status(500).json({

            success:false,

            error:
            error.message


        });


    }


});









// ======================================================
// SIMPLE PDF SEARCH
// فعلاً تستی
// بعداً Gemini RAG
// ======================================================


async function searchPdf(

    pdfData,

    question

){



    const textPreview =

        pdfData.text

        ?

        pdfData.text.substring(
            0,
            1000
        )

        :

        "";





    return `


متن پیدا شده از PDF:



${textPreview}



سوال کاربر:

${question}



تعداد صفحات PDF:

${pdfData.pages}



`;



}









// ======================================================
// MANUAL REGISTER
// اگر خواستیم دستی ثبت کنیم
// ======================================================


router.post(
"/register",
async(req,res)=>{


    try{


        const {

            fileId,

            pages,

            text,

            chunks


        } = req.body;





        if(!fileId){


            return res.json({

                success:false,

                error:
                "fileId required"


            });


        }







        pdfSessions[fileId]={


            pages,


            text,


            chunks:



            chunks || [],



            createdAt:

            new Date()


        };







        console.log(

            "✅ PDF REGISTERED:",

            fileId

        );







        return res.json({

            success:true,

            message:
            "PDF ready"


        });





    }
    catch(error){



        return res.status(500).json({

            success:false,

            error:
            error.message


        });


    }


});









// ======================================================
// EXPORT
// ======================================================


module.exports = router;