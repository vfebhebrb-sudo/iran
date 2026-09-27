const mongoose = require("mongoose");
const connectRoboDatabase = require("../database/roboDatabase");



// ======================================================
// SCHEMA
// ======================================================

const RoboMemorySchema = new mongoose.Schema({

    chatId: {

        type:String,

        required:true,

        index:true

    },


    username: {

        type:String,

        default:null

    },


    name: {

        type:String,

        default:null

    },


    role: {

        type:String,

        default:"user"

    },


    message: {

        type:String,

        required:true

    },


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



    return RoboMemoryModel;


}







// ======================================================
// SAVE MEMORY
// ======================================================

async function saveMemory(data){


    const Model =
    await getRoboMemoryModel();



    await Model.create({

        chatId:String(data.chatId),

        username:data.username || null,

        name:data.name || null,

        role:data.role || "user",

        message:data.message,

        answer:data.answer || null

    });



}








// ======================================================
// GET MEMORY
// ======================================================

async function getMemory(chatId){


    const Model =
    await getRoboMemoryModel();



    return await Model
    .find({

        chatId:String(chatId)

    })
    .sort({

        createdAt:-1

    })
    .limit(20)
    .lean();



}








// ======================================================
// GET USER NAME
// ======================================================

async function getUserName(chatId){


    try{


        const Model =
        await getRoboMemoryModel();



        const user =
        await Model.findOne({

            chatId:String(chatId),

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