const mongoose = require("mongoose");


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


    role: {

        type: String,

        default: "user"

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



module.exports =
mongoose.model(
    "RoboMemory",
    RoboMemorySchema
);