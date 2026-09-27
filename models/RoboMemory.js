const mongoose = require("mongoose");
const connectRoboDatabase = require("../database/roboDatabase");



// ======================================================
// SCHEMA
// ======================================================


const RoboMemorySchema = new mongoose.Schema({


    // آیدی گروه یا چت خصوصی
    chatId: {

        type:String,

        required:true,

        index:true

    },



    // آیدی واقعی کاربر
    userId: {

        type:String,

        required:true,

        index:true

    },



    // یوزرنیم کاربر
    username: {

        type:String,

        default:null

    },



    // اسم کاربر
    name: {

        type:String,

        default:null

    },



    // نقش
    role: {

        type:String,

        default:"user"

    },



    // پیام کاربر
    message: {

        type:String,

        required:true

    },



    // جواب روبو
    answer: {

        type:String,

        default:null

    },



    createdAt: {

        type:Date,

        default:Date.now,

        index:true

    }


});




// جستجوی سریع حافظه کاربران گروه
RoboMemorySchema.index({

    chatId:1,

    userId:1,

    createdAt:-1

});






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
        "🤖 ROBO MEMORY MODEL READY"
    );



    return RoboMemoryModel;


}







// ======================================================
// SAVE MEMORY
// ======================================================


async function saveMemory(data){


    try{


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



        const Model =
        await getRoboMemoryModel();




        await Model.create({



            chatId:
            String(data.chatId),



            userId:
            String(data.userId),



            username:
            data.username || null,



            name:
            data.name || null,



            role:
            data.role || "user",



            message:
            data.message,



            answer:
            data.answer || null



        });



        console.log(
            "🧠 ROBO MEMORY SAVED"
        );



    }
    catch(error){


        console.log(
            "❌ SAVE MEMORY ERROR:",
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



        const memories =
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



        return memories.reverse();



    }
    catch(error){


        console.log(
            "❌ GET MEMORY ERROR:",
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
            "GET NAME ERROR:",
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