const mongoose = require("mongoose");


const counterSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        unique: true
    },

    sequence: {
        type: Number,
        default: 100000
    }

});


module.exports = mongoose.model(
    "Counter",
    counterSchema
);