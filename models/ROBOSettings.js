const mongoose = require("mongoose");


const AISettingsSchema =
new mongoose.Schema({

    provider:{
        type:String,
        default:"gapgpt"
    },


    model:{
        type:String,
        default:"gpt-4o"
    },


    apiKey:{
        type:String,
        required:true
    },


    systemPrompt:{
        type:String,
        default:""
    },


    temperature:{
        type:Number,
        default:0.7
    },


    enabled:{
        type:Boolean,
        default:true
    },


    updatedAt:{
        type:Date,
        default:Date.now
    }


});


module.exports =
mongoose.model(
"AISettings",
AISettingsSchema
);