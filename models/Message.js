const mongoose = require("mongoose");


const MessageSchema = new mongoose.Schema({


    chatId:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"Chat",

        required:true

    },


    // شناسه فرستنده
    sender:{

        type:String,

        default:null

    },


    // اسم نمایشی فرستنده
    senderName:{

        type:String,

        default:"کاربر"

    },


    // نوع حساب
    senderType:{

        type:String,

        enum:[

            "user",
            "admin",
            "ai",
            "system"

        ],

        default:"user"

    },


    // نوع آواتار برای نمایش در فرانت
    avatarType:{

        type:String,

        enum:[

            "user",
            "admin",
            "ai",
            "system"

        ],

        default:"user"

    },


    text:{

        type:String,

        required:true

    },


    file:{

        type:String,

        default:null

    },


    createdAt:{

        type:Date,

        default:Date.now

    }


});



module.exports =
mongoose.model(
    "Message",
    MessageSchema
);