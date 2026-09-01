const express = require("express");

const router = express.Router();

const Test = require("../models/Test");















// ======================================================
// دریافت لیست آزمون های فعال برای پنل آزمون های فعال
// ======================================================

router.get("/", async (req,res)=>{

    try{


        const tests = await Test.find({

            isPublished:true

        })
        .select(
            "title subject duration questionCount createdAt"
        )
        .sort({

            createdAt:-1

        });



        res.status(200).json(tests);



    }
    catch(error){


        console.log(error);


        res.status(500).json({

            message:"خطا در دریافت آزمون های فعال"

        });


    }


});







// ======================================================
// دریافت یک آزمون برای ورود به صفحه تست
// ======================================================

router.get("/:id", async(req,res)=>{


    try{


        const test = await Test.findOne({

            _id:req.params.id,

            isPublished:true

        });



        if(!test){


            return res.status(404).json({

                message:
                "آزمون پیدا نشد"

            });


        }



        res.status(200).json({

            success:true,

            test:test


        });



    }
    catch(error){


        console.log(error);


        res.status(500).json({

            message:
            "خطا در دریافت اطلاعات آزمون"

        });


    }


});









// ======================================================
// ثبت نتیجه آزمون
// ======================================================

router.post("/result", async(req,res)=>{


    try{


        const {

            testId,

            answers,

            score

        } = req.body;



        // فعلا فقط آماده است
        // بعدا اینجا Result Model اضافه میشه



        res.status(200).json({

            success:true,

            message:
            "نتیجه آزمون ثبت شد"



        });



    }
    catch(error){


        res.status(500).json({

            message:
            "خطا در ثبت نتیجه"

        });


    }


});






module.exports = router;