// ======================================================
// STUDY PLAN ROUTES
// ======================================================


const express = require("express");

const router = express.Router();

const StudyPlan = require("../models/StudyPlan");




// ======================================================
// CREATE NEW PLAN
// ساخت برنامه جدید
// ======================================================


router.post("/", async (req,res)=>{

    try {


        const {

            phone,
            day,
            subject,
            subjectName,
            icon,
            color,
            title,
            note,
            duration

        } = req.body;



        // Validation

        if (
            !phone ||
            !day ||
            !subject ||
            !subjectName ||
            !title ||
            !duration
        ) {


            return res.status(400).json({

                success:false,

                message:"اطلاعات برنامه کامل نیست"

            });


        }



        const newPlan = await StudyPlan.create({

            phone,

            day,

            subject,

            subjectName,

            icon,

            color,

            title,

            note: note || "",

            duration


        });



        res.status(201).json({

            success:true,

            message:"برنامه با موفقیت ذخیره شد",

            plan:newPlan

        });



    }

    catch(error){


        console.log(
            "CREATE PLAN ERROR:",
            error
        );


        res.status(500).json({

            success:false,

            message:"خطا در ذخیره برنامه"

        });


    }


});








// ======================================================
// GET USER PLANS
// دریافت برنامه های یک کاربر
// ======================================================


router.get("/:phone", async (req,res)=>{


    try{


        const phone = req.params.phone;



        const plans = await StudyPlan.find({

            phone:phone

        })

        .sort({

            createdAt:-1

        });



        res.json({

            success:true,

            plans

        });



    }

    catch(error){


        console.log(
            "GET PLANS ERROR:",
            error
        );


        res.status(500).json({

            success:false,

            message:"خطا در دریافت برنامه ها"

        });


    }


});









// ======================================================
// UPDATE PLAN
// ویرایش برنامه
// ======================================================


router.put("/:id", async(req,res)=>{


    try{


        const updatedPlan = await StudyPlan.findByIdAndUpdate(

            req.params.id,


            {


                day:req.body.day,

                subject:req.body.subject,

                subjectName:req.body.subjectName,

                icon:req.body.icon,

                color:req.body.color,

                title:req.body.title,

                note:req.body.note || "",

                duration:req.body.duration


            },


            {

                new:true

            }


        );




        if(!updatedPlan){


            return res.status(404).json({

                success:false,

                message:"برنامه پیدا نشد"

            });


        }





        res.json({

            success:true,

            message:"برنامه بروزرسانی شد",

            plan:updatedPlan

        });





    }


    catch(error){


        console.log(

            "UPDATE PLAN ERROR:",

            error

        );



        res.status(500).json({

            success:false,

            message:"خطا در بروزرسانی برنامه"

        });


    }


});









// ======================================================
// DELETE PLAN
// حذف برنامه
// ======================================================


router.delete("/:id", async(req,res)=>{


    try{


        const deletedPlan = await StudyPlan.findByIdAndDelete(

            req.params.id

        );



        if(!deletedPlan){


            return res.status(404).json({

                success:false,

                message:"برنامه پیدا نشد"

            });


        }





        res.json({

            success:true,

            message:"برنامه حذف شد"

        });





    }


    catch(error){


        console.log(

            "DELETE PLAN ERROR:",

            error

        );



        res.status(500).json({

            success:false,

            message:"خطا در حذف برنامه"

        });


    }


});







module.exports = router;