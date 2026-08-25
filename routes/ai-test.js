// ======================================================
// AMIR AI ROUTE
// AI CHAT + AI HISTORY
// ======================================================


const express = require("express");

const router = express.Router();


const AIMessage =
require("../models/AIMessage");


const OpenAI = require("openai");




// ======================================================
// OPENAI CLIENT
// ======================================================


const client = new OpenAI({

    apiKey: process.env.GAPGPT_KEY,

    baseURL:
    "https://api.gapgpt.app/v1"

});




// ======================================================
// GET AI HISTORY
// دریافت تاریخچه گفتگو
// ======================================================


router.get(
"/history/:phone",
async(req,res)=>{


    try{


        const messages =

            await AIMessage.find({

                phone:req.params.phone

            })

            .sort({

                createdAt:1

            });



        res.json({

            success:true,

            messages

        });



    }


    catch(error){


        console.log(

            "AI HISTORY ERROR:",

            error

        );



        res.status(500).json({

            success:false,

            messages:[]

        });


    }


});







// ======================================================
// SAVE AI MESSAGE
// ذخیره پیام AI یا کاربر
// ======================================================


router.post(
"/save",
async(req,res)=>{


    try{


        const {

            phone,

            sender,

            text


        } = req.body;




        if(

            !phone ||

            !text

        ){


            return res.status(400).json({

                success:false,

                message:
                "اطلاعات ناقص است"

            });


        }





        const message =

            new AIMessage({

                phone:phone,

                sender:sender || "user",

                text:text

            });





        await message.save();





        res.json({

            success:true,

            data:message

        });





    }


    catch(error){


        console.log(

            "AI SAVE ERROR:",

            error

        );



        res.status(500).json({

            success:false

        });



    }


});








// ======================================================
// AI CHAT
// ارسال پیام به هوش مصنوعی
// ======================================================


router.post(
"/chat",
async(req,res)=>{


    try{


        const {

            message

        } = req.body;





        if(!message){


            return res.status(400).json({

                success:false,

                error:
                "Message required"

            });


        }







        const response =

            await client.chat.completions.create({



                model:"gpt-4o",




                messages:[



                    {


                        role:"system",


                        content:

                        "تو دستیار هوشمند سایت برنامه کنکور هستی. پاسخ‌ها را فارسی، کوتاه و مفید بده."

                    },



                    {


                        role:"user",


                        content:message

                    }



                ]



            });








        const reply =

            response

            .choices[0]

            .message

            .content;







        res.json({


            success:true,


            reply


        });





    }


    catch(error){


        console.log(


            "AI CHAT ERROR:",


            error.response?.data ||

            error.message


        );




        res.status(500).json({


            success:false,


            error:
            "AI failed"


        });



    }



});






module.exports = router;