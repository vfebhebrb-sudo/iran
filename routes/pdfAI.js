const express = require("express");
const router = express.Router();


// سوال از PDF
router.post("/ask", async (req,res)=>{

    try{

        const {
            question,
            sessionId
        } = req.body;


        if(!question){

            return res.json({
                success:false,
                error:"Question required"
            });

        }



        console.log(
            "📚 PDF AI QUESTION:",
            question
        );



        /*
          اینجا بعداً وصل می‌کنیم به:
          - متن استخراج شده PDF
          - Vector DB
          - Gemini
          - RAG
        */


        return res.json({

            success:true,

            answer:
            "PDF AI آماده دریافت سوال است",

            sessionId

        });



    }
    catch(error){

        console.error(
            "PDF AI ERROR:",
            error
        );


        res.status(500).json({

            success:false,
            error:error.message

        });

    }

});


module.exports = router;