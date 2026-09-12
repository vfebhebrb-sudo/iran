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







// ======================================================
// وضعیت آنلاین کاربران
// مخصوص پنل مدیریت
// ======================================================


router.get("/users/activity", async (req,res)=>{


    try{


        const now = Date.now();



        const ONLINE_LIMIT =
            90 * 1000; 
            // 90 ثانیه


        const RECENT_LIMIT =
            5 * 60 * 1000;
            // 5 دقیقه





        const users =
            await User.find()

            .select(
                "fullname email phone chatId " +
                "profileImage verified " +
                "lastSeenAt lastLoginAt " +
                "lastLogoutAt createdAt"
            )

            .sort({
                lastSeenAt:-1,
                createdAt:-1
            });






        let online = 0;
        let recent = 0;
        let offline = 0;






        const activityUsers =
            users.map(user=>{


                let status =
                    "offline";


                let statusText =
                    "آفلاین";


                let lastSeenAgo =
                    "-";




                if(user.lastSeenAt){



                    const lastSeen =
                        new Date(
                            user.lastSeenAt
                        ).getTime();



                    const diff =
                        now - lastSeen;




                    if(diff <= ONLINE_LIMIT){


                        status =
                            "online";


                        statusText =
                            "آنلاین";


                        online++;


                    }


                    else if(diff <= RECENT_LIMIT){


                        status =
                            "recent";


                        statusText =
                            "اخیراً فعال";


                        recent++;


                    }


                    else{


                        status =
                            "offline";


                        statusText =
                            "آفلاین";


                        offline++;


                    }






                    if(diff < 60000){


                        lastSeenAgo =
                            "همین الان";


                    }


                    else if(diff < 3600000){


                        lastSeenAgo =
                            Math.floor(
                                diff / 60000
                            )
                            +
                            " دقیقه پیش";


                    }


                    else if(diff < 86400000){


                        lastSeenAgo =
                            Math.floor(
                                diff / 3600000
                            )
                            +
                            " ساعت پیش";


                    }


                    else{


                        lastSeenAgo =
                            Math.floor(
                                diff / 86400000
                            )
                            +
                            " روز پیش";


                    }



                }
                else{


                    offline++;


                }






                return {


                    _id:
                        user._id,


                    fullname:
                        user.fullname,


                    email:
                        user.email,


                    phone:
                        user.phone,


                    chatId:
                        user.chatId,


                    profileImage:
                        user.profileImage,


                    verified:
                        user.verified,



                    status,


                    statusText,


                    lastSeenAgo,


                    lastSeenAt:
                        user.lastSeenAt



                };



            });







        res.json({


            success:true,


            stats:{


                online,


                recent,


                offline



            },



            count:
                activityUsers.length,



            users:
                activityUsers



        });



    }


    catch(error){



        console.log(
            "GET USER ACTIVITY ERROR:",
            error
        );



        res.status(500).json({


            success:false,


            message:
                "خطا در دریافت وضعیت کاربران"



        });



    }



});

module.exports = router;