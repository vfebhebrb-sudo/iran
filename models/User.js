const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({


    fullname:{
        type:String,
        default:null
    },


    email:{
        type:String,
        default:null
    },


    password:{
        type:String,
        default:null
    },


    phone:{
        type:String,
        required:true,
        unique:true
    },

    chatId:{
    type:String,
    default:null
    },

    // شناسه چت روبیکا
    chatId:{
        type:String,
        required:false,
        default:null
    },


    otp:{
        type:String,
        default:null
    },


    otpExpire:{
        type:Date,
        default:null
    },


    verified:{
        type:Boolean,
        default:false
    },


    createdAt:{
        type:Date,
        default:Date.now
    }


});


module.exports = mongoose.model(
    "User",
    userSchema
);