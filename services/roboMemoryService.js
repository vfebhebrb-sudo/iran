const mongoose = require("mongoose");
const connectRoboDatabase = require("../database/roboDatabase");


// ======================================================
// ROBO MEMORY SCHEMA
// ======================================================

const RoboMemorySchema = new mongoose.Schema({

    // شناسه چت تلگرام
    chatId: {

        type: String,

        required: true,

        index: true

    },


    // یوزرنیم تلگرام
    username: {

        type: String,

        default: null

    },


    // اسم کاربر
    name: {

        type: String,

        default: null

    },


    // پیام کاربر
    message: {

        type: String,

        required: true

    },


    // پاسخ روبو
    answer: {

        type: String,

        default: null

    },


    // زمان پیام
    createdAt: {

        type: Date,

        default: Date.now,

        index:true

    }


});




// جلوگیری از ساخت دوباره مدل
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
// ذخیره گفتگو
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





        // ==================================
        // نگه داشتن فقط 1000 پیام آخر
        // ==================================


        const count =
        await Model.countDocuments({

            chatId:
            String(data.chatId)

        });





        if(count > 1000){


            const deleteCount =
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
            .limit(deleteCount);





            await Model.deleteMany({

                _id:{

                    $in:
                    oldMessages.map(
                        item=>item._id
                    )

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
// GET MEMORY
// دریافت تاریخچه گفتگو
// ======================================================

async function getMemory(chatId){


    try{


        const Model =
        await getRoboMemoryModel();




        const memories =
        await Model
        .find({

            chatId:
            String(chatId)

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
            "❌ ROBO MEMORY READ ERROR:",
            error.message
        );


        return [];

    }


}





// ======================================================
// GET LAST USER NAME
// پیدا کردن آخرین اسم کاربر
// ======================================================

async function getUserName(chatId){


    try{


        const Model =
        await getRoboMemoryModel();



        const user =
        await Model
        .findOne({

            chatId:
            String(chatId),

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


        return null;


    }


}







module.exports = {


    getRoboMemoryModel,

    saveMemory,

    getMemory,

    getUserName


};