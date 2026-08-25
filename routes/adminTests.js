const express = require("express");

const router = express.Router();

const Test = require("../models/Test");




// ======================================================
// دریافت تمام آزمون ها برای پنل مدیریت
// ======================================================

router.get(
"/",
async(req,res)=>{


    try{


        const tests = await Test.find()

        .sort({

            createdAt:-1

        });



        res.json(tests);



    }
    catch(error){


        res.status(500).json({

            message:
            "خطا در دریافت آزمون ها",

            error:
            error.message

        });


    }


});









// ======================================================
// دریافت یک آزمون کامل برای صفحه مدیریت آزمون
// ======================================================

router.get(
"/:id",
async(req,res)=>{


    try{


        const test = await Test.findById(

            req.params.id

        );



        if(!test){


            return res.status(404).json({

                message:
                "آزمون پیدا نشد"

            });


        }



        res.json(test);



    }
    catch(error){


        res.status(500).json({

            message:
            "خطا در دریافت آزمون",

            error:
            error.message

        });


    }


});





// ======================================================
// ساخت آزمون جدید از پنل مدیریت
// ======================================================

router.post("/create", async(req,res)=>{

    try{

        const {
            title,
            subject,
            questions,
            duration,
            advice
        } = req.body;


        const test = new Test({

            title,
            subject,
            questions,
            duration,
            advice,

            questionCount: questions.length,

            isPublished:false

        });


        await test.save();


        res.status(201).json({

            success:true,

            message:"آزمون ساخته شد",

            test

        });


    }catch(error){

        console.log(error);


        res.status(500).json({

            success:false,

            message:"خطا در ساخت آزمون"

        });

    }

});



// ======================================================
// انتشار آزمون برای دانش آموز
// ======================================================

router.put(
"/publish/:id",

async(req,res)=>{


    try{


        const test = await Test.findByIdAndUpdate(

            req.params.id,

            {

                isPublished:true

            },

            {

                new:true

            }

        );




        if(!test){


            return res.status(404).json({

                message:
                "آزمون پیدا نشد"

            });


        }




        res.json({

            message:
            "آزمون فعال شد",

            test

        });



    }
    catch(error){


        res.status(500).json({

            message:
            "خطا در فعال سازی آزمون",

            error:
            error.message

        });


    }


});









// ======================================================
// غیرفعال کردن آزمون برای دانش آموز
// ======================================================

router.put(
"/unpublish/:id",

async(req,res)=>{


    try{


        const test = await Test.findByIdAndUpdate(

            req.params.id,

            {

                isPublished:false

            },

            {

                new:true

            }

        );




        if(!test){


            return res.status(404).json({

                message:
                "آزمون پیدا نشد"

            });


        }




        res.json({

            message:
            "آزمون غیرفعال شد",

            test

        });



    }
    catch(error){


        res.status(500).json({

            message:
            "خطا در غیرفعال کردن آزمون",

            error:
            error.message

        });


    }


});









// ======================================================
// حذف کامل آزمون
// ======================================================

router.delete(
"/delete/:id",

async(req,res)=>{


    try{


        const test = await Test.findByIdAndDelete(

            req.params.id

        );




        if(!test){


            return res.status(404).json({

                message:
                "آزمون پیدا نشد"

            });


        }




        res.json({

            message:
            "آزمون حذف شد"

        });



    }
    catch(error){


        res.status(500).json({

            message:
            "خطا در حذف آزمون",

            error:
            error.message

        });


    }


});









// ======================================================
// حذف یک سوال از آزمون
// ======================================================

router.delete(

"/delete/:testId/question/:questionId",

async(req,res)=>{


    try{


        const test = await Test.findById(

            req.params.testId

        );




        if(!test){


            return res.status(404).json({

                message:
                "آزمون پیدا نشد"

            });


        }




        test.questions.pull({

            _id:
            req.params.questionId

        });




        test.questionCount =

        test.questions.length;




        await test.save();




        res.json({

            message:
            "سوال حذف شد",

            test

        });



    }
    catch(error){


        res.status(500).json({

            message:
            "خطا در حذف سوال",

            error:
            error.message

        });


    }


});








module.exports = router;