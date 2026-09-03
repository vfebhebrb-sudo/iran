const mongoose = require("mongoose");


const AISettingsSchema = new mongoose.Schema({


    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },


    provider:{
        type:String,
        required:true
    },


    model:{
        type:String,
        default:""
    },


    apiKey:{
        type:String,
        required:true
    },


    active:{
        type:Boolean,
        default:true
    },


    createdAt:{
        type:Date,
        default:Date.now
    }


});


module.exports =
mongoose.model(
    "AISettings",
    AISettingsSchema
);