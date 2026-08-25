const express = require("express");
const router = express.Router();

const User = require("../models/User");
const rubikaBot = require("../rubika/bot");



// ======================================================
// SEND RESET OTP
// ======================================================

router.post(
"/send-reset-otp",
async(req,res)=>{


    try{


        const { phone } =
        req.body;



        if(!phone){

            return res.status(400).json({

                success:false,
                message:"شماره تلفن وارد نشده"

            });

        }




        const user =
        await User.findOne({

            phone

        });





        if(!user){

            return res.status(404).json({

                success:false,
                message:"کاربر پیدا نشد"

            });

        }





        if(!user.chatId){


            return res.status(400).json({

                success:false,
                message:"شناسه روبیکا ثبت نشده"

            });


        }





        const otp =
        Math.floor(
            1000 + Math.random()*9000
        )
        .toString();





        user.otp = otp;


        user.otpExpire =
        new Date(
            Date.now() + 2 * 60 * 1000
        );



        await user.save();





        await rubikaBot.sendOTP(

            user.chatId,

            otp

        );





        console.log(
            "RESET OTP SENT:",
            phone
        );





        res.json({

            success:true,

            message:"کد تایید ارسال شد"

        });



    }


    catch(error){


        console.log(
            "SEND RESET OTP ERROR:",
            error
        );


        res.status(500).json({

            success:false,

            message:"خطای سرور"

        });


    }



});









// ======================================================
// VERIFY RESET OTP
// ======================================================


router.post(
"/verify-reset-otp",
async(req,res)=>{


    try{


        const {
            phone,
            otp

        } = req.body;





        if(!phone || !otp){


            return res.status(400).json({

                success:false,

                message:
                "شماره و کد تایید الزامی است"

            });


        }





        const user =
        await User.findOne({

            phone

        });





        if(!user){


            return res.status(404).json({

                success:false,

                message:
                "کاربر پیدا نشد"

            });


        }






        if(
            !user.otpExpire ||
            user.otpExpire < new Date()
        ){


            return res.status(400).json({

                success:false,

                message:
                "کد تایید منقضی شده است"

            });


        }





        if(user.otp !== otp){


            return res.status(400).json({

                success:false,

                message:
                "کد تایید اشتباه است"

            });


        }





        res.json({

            success:true,

            message:
            "کد تایید شد"

        });




    }


    catch(error){


        console.log(
            "VERIFY RESET ERROR:",
            error
        );



        res.status(500).json({

            success:false,

            message:
            "خطای سرور"

        });



    }



});









// ======================================================
// CHANGE PASSWORD
// ======================================================


router.post(
"/change-password",
async(req,res)=>{


    try{


        const {

            phone,

            newPassword

        } = req.body;






        if(!phone || !newPassword){


            return res.status(400).json({

                success:false,

                message:
                "اطلاعات ناقص است"

            });


        }





        const user =
        await User.findOne({

            phone

        });






        if(!user){


            return res.status(404).json({

                success:false,

                message:
                "کاربر پیدا نشد"

            });


        }





        user.password =
        newPassword;



        // پاک کردن OTP بعد از تغییر رمز

        user.otp = null;

        user.otpExpire = null;



        await user.save();







        console.log(

            "PASSWORD CHANGED:",
            phone

        );







        res.json({

            success:true,

            message:
            "رمز عبور با موفقیت تغییر کرد"

        });





    }


    catch(error){


        console.log(

            "CHANGE PASSWORD ERROR:",
            error

        );



        res.status(500).json({

            success:false,

            message:
            "خطای سرور"

        });


    }



});






module.exports = router;