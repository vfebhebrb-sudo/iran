const mongoose = require("mongoose");
const connectRoboDatabase = require("../database/roboDatabase");


// ======================================================
// ROBO MEMORY MODEL
// ======================================================

const RoboMemorySchema = new mongoose.Schema({

    chatId: {

        type: String,

        required: true,

        index: true

    },


    username: {

        type: String,

        default: null

    },


    name: {

        type: String,

        default: null

    },


    message: {

        type: String,

        required: true

    },


    answer: {

        type: String,

        default: null

    },


    createdAt: {

        type: Date,

        default: Date.now

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
// SAVE MESSAGE
// ذخیره پیام کاربر و جواب روبو
// ======================================================

async function saveMemory(data){


    try{


        const Model =
        await getRoboMemoryModel();



        await Model.create({


            chatId:
            String(data.chatId),


            username:
            data.username || null,


            name:
            data.name || null,


            message:
            data.message,


            answer:
            data.answer || null


        });




        // ================================
        // فقط 1000 پیام آخر هر چت
        // ================================


        const count =
        await Model.countDocuments({

            chatId:
            String(data.chatId)

        });



        if(count > 1000){



            const removeCount =
            count - 1000;



            const oldMessages =
            await Model
            .find({

                chatId:
                String(data.chatId)

            })
            .sort({

                createdAt:1

            })
            .limit(

                removeCount

            );




            await Model.deleteMany({

                _id:{

                    $in:
                    oldMessages.map(
                        item=>item._id
                    )

                }

            });


        }



    }
    catch(error){


        console.log(
            "❌ ROBO SAVE MEMORY ERROR:",
            error.message
        );


    }


}






// ======================================================
// GET MEMORY
// گرفتن تاریخچه کاربر
// ======================================================

async function getMemory(chatId){


    try{


        const Model =
        await getRoboMemoryModel();



        return await Model
        .find({

            chatId:
            String(chatId)

        })
        .sort({

            createdAt:-1

        })
        .limit(20)
        .lean();



    }
    catch(error){


        console.log(
            "❌ ROBO GET MEMORY ERROR:",
            error.message
        );


        return [];


    }


}





// ======================================================
// EXPORT
// ======================================================

module.exports = {


    getRoboMemoryModel,

    saveMemory,

    getMemory


};