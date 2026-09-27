const mongoose = require("mongoose");
const connectRoboDatabase = require("../database/roboDatabase");



// ======================================================
// ROBO MEMORY SCHEMA
// ======================================================

const RoboMemorySchema = new mongoose.Schema({

    // گروه یا چت خصوصی
    chatId:{
        type:String,
        required:true,
        index:true
    },


    // آیدی واقعی کاربر
    userId:{
        type:String,
        required:true,
        index:true
    },


    // یوزرنیم
    username:{
        type:String,
        default:null
    },


    // اسم ذخیره شده
    name:{
        type:String,
        default:null
    },


    // پیام
    message:{
        type:String,
        required:true
    },


    // پاسخ
    answer:{
        type:String,
        default:null
    },


    createdAt:{
        type:Date,
        default:Date.now,
        index:true
    }


});




// جلوگیری از ساخت مدل دوباره

let RoboMemoryModel = null;




// ======================================================
// GET MODEL
// ======================================================

async function getRoboMemoryModel(){


    if(RoboMemoryModel){

        return RoboMemoryModel;

    }


    const connection =
    await connectRoboDatabase();



    RoboMemoryModel =
    connection.model(
        "RoboMemory",
        RoboMemorySchema
    );



    console.log(
        "🤖 ROBO MEMORY MODEL READY ✅"
    );


    return RoboMemoryModel;

}





// ======================================================
// SAVE MEMORY
// ======================================================

async function saveMemory(data){


    try{


        const Model =
        await getRoboMemoryModel();



        if(
            !data.chatId ||
            !data.userId ||
            !data.message
        ){

            console.log(
                "❌ INVALID MEMORY DATA"
            );

            return;

        }




        await Model.create({

            chatId:
            String(data.chatId),


            userId:
            String(data.userId),


            username:
            data.username || null,


            name:
            data.name || null,


            message:
            data.message,


            answer:
            data.answer || null

        });





        // فقط 1000 پیام آخر هر کاربر در هر گروه

        const count =
        await Model.countDocuments({

            chatId:
            String(data.chatId),


            userId:
            String(data.userId)

        });





        if(count > 1000){


            const remove =
            count - 1000;



            const old =
            await Model.find({

                chatId:
                String(data.chatId),


                userId:
                String(data.userId)

            })
            .sort({
                createdAt:1
            })
            .limit(remove);





            await Model.deleteMany({

                _id:{
                    $in:
                    old.map(x=>x._id)
                }

            });



        }





        console.log(
            "🧠 ROBO MEMORY SAVED"
        );



    }
    catch(error){


        console.log(
            "❌ ROBO SAVE ERROR:",
            error.message
        );


    }


}







// ======================================================
// GET MEMORY USER
// ======================================================

async function getMemory(chatId,userId){


    try{


        const Model =
        await getRoboMemoryModel();




        const data =
        await Model.find({

            chatId:
            String(chatId),


            userId:
            String(userId)

        })
        .sort({

            createdAt:-1

        })
        .limit(20)
        .lean();




        return data.reverse();



    }
    catch(error){


        console.log(
            "❌ MEMORY READ ERROR:",
            error.message
        );


        return [];


    }


}








// ======================================================
// GET USER NAME
// ======================================================

async function getUserName(chatId,userId){


    try{


        const Model =
        await getRoboMemoryModel();



        const user =
        await Model.findOne({

            chatId:
            String(chatId),


            userId:
            String(userId),


            name:{
                $ne:null
            }

        })
        .sort({

            createdAt:-1

        })
        .lean();




        return user?.name || null;



    }
    catch(error){


        console.log(
            "❌ GET NAME ERROR:",
            error.message
        );


        return null;


    }


}







module.exports = {


    getRoboMemoryModel,

    saveMemory,

    getMemory,

    getUserName


};