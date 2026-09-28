const mongoose = require("mongoose");
const connectRoboDatabase = require("../database/roboDatabase");


// ======================================================
// GROUP MEMORY SCHEMA
// ======================================================

const GroupMemorySchema = new mongoose.Schema({

    chatId:{
        type:String,
        required:true,
        index:true
    },


    userId:{
        type:String,
        required:true,
        index:true
    },


    username:{
        type:String,
        default:null
    },


    message:{
        type:String,
        required:true
    },


    createdAt:{
        type:Date,
        default:Date.now,
        index:true
    }


});



let GroupMemoryModel = null;



// ======================================================
// GET MODEL
// ======================================================

async function getGroupMemoryModel(){


    if(GroupMemoryModel){

        return GroupMemoryModel;

    }



    const db =
    await connectRoboDatabase();



    GroupMemoryModel =
    db.model(
        "RoboGroupMemory",
        GroupMemorySchema
    );



    console.log(
        "👥 ROBO GROUP MEMORY READY ✅"
    );



    return GroupMemoryModel;


}





// ======================================================
// SAVE MESSAGE
// ======================================================

async function saveGroupMessage(data){


    try{


        const Model =
        await getGroupMemoryModel();



        if(
            !data.chatId ||
            !data.userId ||
            !data.message
        ){

            return;

        }



        await Model.create({

            chatId:
            String(data.chatId),


            userId:
            String(data.userId),


            username:
            data.username || null,


            message:
            data.message

        });



        console.log(
            "👥 GROUP MESSAGE SAVED"
        );



    }
    catch(error){


        console.log(
            "❌ GROUP MEMORY ERROR:",
            error.message
        );


    }


}





// ======================================================
// GET LAST MESSAGES
// ======================================================

async function getRecentGroupMessages(chatId){


    try{


        const Model =
        await getGroupMemoryModel();



        const messages =
        await Model.find({

            chatId:
            String(chatId)

        })
        .sort({

            createdAt:-1

        })
        .limit(30)
        .lean();



        return messages.reverse();



    }
    catch(error){


        console.log(
            "❌ GROUP READ ERROR:",
            error.message
        );


        return [];


    }


}





module.exports = {


    saveGroupMessage,

    getRecentGroupMessages


};