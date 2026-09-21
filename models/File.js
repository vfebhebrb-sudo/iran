const mongoose = require("mongoose");



const fileSchema = new mongoose.Schema({



    // ===============================
    // FILE INFO
    // ===============================


    name: {

        type: String,

        required: true,

        trim: true

    },


    lesson: {

        type: String,

        default: "سایر",

        trim: true,

        index: true

    },


    fileId: {

        type: String,

        required: true,

        unique: true,

        index: true

    },


    fileType: {

        type: String,

        default: "pdf"

    },


    size: {

        type: Number,

        default: 0

    },



    // ===============================
    // SOURCE
    // ===============================


    source: {

        type: String,

        default: "rubika"

    },


    chatId: {

        type: String,

        default: null

    },



    // ===============================
    // STORAGE
    // ===============================


    tempPath: {

        type: String,

        default: null

    },


    tempCreatedAt: {

        type: Date,

        default: null

    },



    // ===============================
    // WEBSITE DISPLAY
    // ===============================


    title: {

        type: String,

        default: null,

        trim: true

    },


    description: {

        type: String,

        default: null,

        trim: true

    },


    pages: {

        type: Number,

        default: 0

    },


    downloads: {

        type: Number,

        default: 0

    },



    // ===============================
    // STATUS
    // ===============================


    status: {

        type: String,

        enum: [
            "active",
            "hidden",
            "deleted"
        ],

        default: "active"

    },



    // ===============================
    // DATE
    // ===============================


    createdAt: {

        type: Date,

        default: Date.now

    },


    updatedAt: {

        type: Date,

        default: Date.now

    }



});





// آپدیت خودکار زمان تغییر

fileSchema.pre(
    "save",
    function(next){

        this.updatedAt =
        Date.now();

        next();

    }
);





module.exports =
mongoose.model(
    "File",
    fileSchema
);