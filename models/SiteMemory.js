const mongoose = require("mongoose");


const SiteMemorySchema = new mongoose.Schema({

    type:{
        type:String,
        required:true,
        index:true
    },


    key:{
        type:String,
        required:true
    },


    value:{
        type:mongoose.Schema.Types.Mixed
    },


    updatedAt:{
        type:Date,
        default:Date.now
    }


});


module.exports =
mongoose.model(
    "SiteMemory",
    SiteMemorySchema
);