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
// آماده سازی Context برای Gemini
// ======================================================


async function searchPdf(

    pdfData,

    question

){


    try{


        const text =

            pdfData.text || "";




        if(!text){


            return {


                success:false,


                error:
                "PDF text is empty"


            };


        }





        // تمیز کردن سوال

        const keywords =

            question

            .replace(
                /[؟?!.,]/g,
                ""
            )

            .split(" ")

            .filter(

                word =>

                word.length > 2

            );






        let bestIndex = -1;

        let bestScore = 0;






        // پیدا کردن نزدیک ترین بخش متن


        for(
            let i = 0;
            i < text.length;
            i += 500
        ){



            const chunk =

                text.substring(

                    i,

                    i + 1500

                );




            let score = 0;




            keywords.forEach(

                word => {


                    if(

                        chunk.includes(word)

                    ){

                        score++;

                    }


                }

            );





            if(score > bestScore){


                bestScore = score;


                bestIndex = i;


            }


        }









        let context = "";





        if(bestIndex !== -1){


            context =

                text.substring(


                    Math.max(

                        0,

                        bestIndex - 500

                    ),



                    bestIndex + 2500


                );



        }

        else{


            context =

                text.substring(

                    0,

                    2500

                );


        }








        console.log(

            "🔎 PDF SEARCH SCORE:",

            bestScore

        );







        return {


            success:true,


            type:

            "pdf_context",



            question,



            context,



            pages:

            pdfData.pages || 0



        };



    }

    catch(error){



        console.error(

            "❌ SEARCH PDF ERROR:",

            error

        );



        return {


            success:false,


            error:

            error.message



        };


    }


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