const express = require("express");

const router = express.Router();

const telegramBot =
require("../telegram/bot");



// =====================================
// NEW FILE NOTIFY
// =====================================

router.post(
"/new-file",
async(req,res)=>{


    try{


        const file =
        req.body;



        console.log(
            "📥 NEW FILE FROM FRONT:",
            file
        );



        await telegramBot.notifyNewFile({

            name:file.name,

            lesson:file.lesson || "نامشخص",

            size:file.size || 0,

            fileId:file.id,

            link:file.link

        });



        res.json({

            success:true

        });



    }
    catch(error){


        console.log(
            "❌ TELEGRAM ROUTE ERROR:",
            error.message
        );


        res.status(500).json({

            success:false,

            error:error.message

        });


    }


});



module.exports = router;