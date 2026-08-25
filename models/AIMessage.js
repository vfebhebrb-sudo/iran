const mongoose = require("mongoose");


const AIMessageSchema = new mongoose.Schema({


    phone: {

        type: String,

        required: true

    },


    sender: {

        type: String,

        enum: [
            "user",
            "ai"
        ],

        default: "user"

    },


    text: {

        type: String,

        required: true

    },


    createdAt: {

        type: Date,

        default: Date.now

    }


});



module.exports =
mongoose.models.AIMessage ||

mongoose.model(
    "AIMessage",
    AIMessageSchema
);