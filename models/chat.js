const mongoose = require("mongoose");


const ChatSchema = new mongoose.Schema({

    name:{
        type:String,
        default:""
    },


    type:{
        type:String,
        enum:[
            "private",
            "group",
            "channel",
            "ai"
        ],
        default:"private"
    },


    members:[

        {
            type:String
        }

    ],


    admins:[

        {
            type:String
        }

    ],


    lastMessage:{

        type:String,

        default:""

    },


    createdAt:{

        type:Date,

        default:Date.now

    },


    updatedAt:{

        type:Date,

        default:Date.now

    }


});



module.exports =
mongoose.model(
    "Chat",
    ChatSchema
);