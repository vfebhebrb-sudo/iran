const mongoose = require("mongoose");


const fileSchema = new mongoose.Schema({


    name: {

        type: String,

        required: true,

        trim: true

    },


    lesson: {

        type: String,

        required: true,

        trim: true

    },


    fileId: {

        type: String,

        required: true,

        unique: true

    },


    fileType: {

        type: String,

        default: "pdf"

    },


    size: {

        type: Number,

        default: 0

    },


    source: {

        type: String,

        default: "rubika"

    },


    chatId: {

        type: String,

        default: null

    },


    // ===============================
    // TEMP FILE STORAGE
    // ===============================

    tempPath: {

        type: String,

        default: null

    },


    tempCreatedAt: {

        type: Date,

        default: null

    },

    lesson:{
    type:String,
    default:"سایر"
    },

    createdAt: {

        type: Date,

        default: Date.now

    }


    
});


module.exports = 
mongoose.model(
    "File",
    fileSchema
);