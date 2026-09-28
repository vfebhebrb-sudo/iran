const mongoose = require("mongoose");
const connectRoboDatabase = require("../database/roboDatabase");


const GroupMemorySchema =
new mongoose.Schema({

    chatId:{
        type:String,
        required:true,
        index:true
    },


    userId:{
        type:String,
        required:true
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



let Model = null;



async function getModel(){


    if(Model)
        return Model;


    const db =
    await connectRoboDatabase();



    Model =
    db.model(
        "RoboGroupMemory",
        GroupMemorySchema
    );


    console.log(
        "👥 GROUP MEMORY READY"
    );


    return Model;

}





async function saveGroupMessage(data){


    try{


        const M =
        await getModel();



        await M.create({

            chatId:
            String(data.chatId),


            userId:
            String(data.userId),


            username:
            data.username || null,


            message:
            data.message


        });



    }
    catch(error){


        console.log(
            "GROUP MEMORY ERROR:",
            error.message
        );


    }


}





async function getRecentGroupMessages(chatId){


    try{


        const M =
        await getModel();



        return await M.find({

            chatId:
            String(chatId)

        })
        .sort({
            createdAt:-1
        })
        .limit(30)
        .lean();



    }
    catch(error){

        return [];

    }


}



module.exports={

saveGroupMessage,
getRecentGroupMessages

};