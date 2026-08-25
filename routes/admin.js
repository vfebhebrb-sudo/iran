// ======================================================
// ADMIN ROUTE
// مدیریت کاربران
// ======================================================


const express = require("express");

const router = express.Router();


console.log("ADMIN ROUTE LOADED");



const User = require("../models/User");





// ======================================================
// دریافت لیست کاربران
// برای پنل مدیریت و ساخت کانال
// ======================================================


router.get("/users", async(req,res)=>{


    try{


        const users = await User.find()


        .select(
            "-password -otp -otpExpire"
        )


        .sort({

            createdAt:-1

        });




        res.status(200).json({


            success:true,


            count:users.length,


            users


        });




    }
    catch(error){



        console.log(
            "GET USERS ERROR:"
        );


        console.log(error);




        res.status(500).json({


            success:false,


            message:
            "خطا در دریافت کاربران"



        });



    }



});









// ======================================================
// دریافت کاربران تایید شده
// مخصوص ساخت کانال
// ======================================================


router.get("/channel-users", async(req,res)=>{


    try{


        const users = await User.find({


            verified:true


        })


        .select(

            "fullname phone chatId"

        )


        .sort({

            createdAt:-1

        });






        res.json({


            success:true,


            users



        });




    }
    catch(error){



        console.log(
            "CHANNEL USERS ERROR:",
            error
        );



        res.status(500).json({


            success:false,


            message:
            "خطا در دریافت کاربران"



        });



    }



});









// ======================================================
// آمار کاربران
// ======================================================


router.get("/stats", async(req,res)=>{


    try{


        const totalUsers =

        await User.countDocuments();




        const verifiedUsers =

        await User.countDocuments({

            verified:true

        });






        const latestUser =

        await User.findOne()


        .sort({

            createdAt:-1

        })


        .select(
            "fullname createdAt"
        );






        res.json({


            success:true,


            totalUsers,


            verifiedUsers,


            latestUser



        });





    }
    catch(error){


        console.log(error);



        res.status(500).json({


            success:false,


            message:
            "خطا در دریافت آمار"



        });



    }



});









// ======================================================
// حذف کاربر
// ======================================================


router.delete("/users/:id", async(req,res)=>{


    try{


        const deletedUser =

        await User.findByIdAndDelete(

            req.params.id

        );




        if(!deletedUser){


            return res.status(404).json({


                success:false,


                message:
                "کاربر پیدا نشد"



            });



        }





        res.json({


            success:true,


            message:
            "کاربر حذف شد"



        });





    }
    catch(error){


        console.log(
            "DELETE USER ERROR:",
            error
        );



        res.status(500).json({


            success:false,


            message:
            "خطا در حذف کاربر"



        });



    }



});







module.exports = router;