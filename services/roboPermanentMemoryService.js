const mongoose = require("mongoose");
const connectRoboDatabase = require("../database/roboDatabase");


// ======================================================
// PERMANENT MEMORY SCHEMA
// ======================================================


const PermanentMemorySchema =
new mongoose.Schema({

    userId:{
        type:String,
        required:true,
        index:true
    },


    // گروهی که اولین بار شناخت
    chatId:{
        type:String,
        default:null
    },


    name:{
        type:String,
        default:null
    },


    facts:{
        type:[String],
        default:[]
    },

    preferences:{
        type:[String],
        default:[]
    },

    notes:{
        type:[String],
        default:[]
    },

    preferences:[
        String
    ],


    notes:[
        String
    ],


    updatedAt:{
        type:Date,
        default:Date.now
    }


});



let PermanentModel = null;



async function getPermanentModel(){


    if(PermanentModel){

        return PermanentModel;

    }


    const db =
    await connectRoboDatabase();



    PermanentModel =
    db.model(
        "RoboPermanentMemory",
        PermanentMemorySchema
    );


    console.log(
        "🧠 PERMANENT MEMORY READY ✅"
    );


    return PermanentModel;


}





// ======================================================
// SAVE PERMANENT DATA
// ======================================================


async function savePermanentMemory(data){


    try{


        const Model =
        await getPermanentModel();



        await Model.findOneAndUpdate(

            {
                userId:
                String(data.userId)
            },


            {


                $set:{


                    updatedAt:
                    new Date(),


                    ...(data.name ?
                    {
                        name:data.name
                    }
                    :
                    {})


                },


                $setOnInsert:{


                    chatId:
                    String(data.chatId || "")


                },



                $addToSet:{


                    facts:{
                        $each:
                        data.facts || []
                    },


                    preferences:{
                        $each:
                        data.preferences || []
                    },


                    notes:{
                        $each:
                        data.notes || []
                    }


                }


            },


            {
                upsert:true
            }


        );



        console.log(
            "🧠 PERMANENT MEMORY SAVED"
        );


    }
    catch(error){


        console.log(
            "❌ PERMANENT MEMORY ERROR:",
            error.message
        );


    }


}







// ======================================================
// GET PERMANENT
// ======================================================


async function getPermanentMemory(userId){


    try{


        const Model =
        await getPermanentModel();



        return await Model.findOne({

            userId:
            String(userId)

        })
        .lean();



    }
    catch(error){


        console.log(
            "❌ PERMANENT READ ERROR:",
            error.message
        );


        return null;


    }


}





module.exports = {


    savePermanentMemory,

    getPermanentMemory


};