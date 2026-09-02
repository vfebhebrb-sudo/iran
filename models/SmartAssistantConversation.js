
const mongoose = require("mongoose");


// ======================================================
// 🤖 SMART ASSISTANT CONVERSATION MODEL
// ======================================================

const smartAssistantMessageSchema =
    new mongoose.Schema(

        {

            role: {

                type: String,

                enum: [
                    "user",
                    "assistant",
                    "system"
                ],

                required: true

            },


            content: {

                type: String,

                required: true

            },


            createdAt: {

                type: Date,

                default: Date.now

            }

        },

        {
            _id: true
        }

    );


// ======================================================
// 🧠 CONVERSATION
// ======================================================

const smartAssistantConversationSchema =
    new mongoose.Schema(

        {

            phone: {

                type: String,

                required: true,

                unique: true,

                index: true

            },


            messages: {

                type:
                    [smartAssistantMessageSchema],

                default: []

            },


            updatedAt: {

                type: Date,

                default: Date.now

            }

        },

        {

            timestamps: true

        }

    );


// ======================================================
// 📌 LIMIT MEMORY TO 1000 MESSAGES
// ======================================================

smartAssistantConversationSchema.pre(
    "save",
    function(next){

        if(
            this.messages &&
            this.messages.length > 1000
        ){

            this.messages =
                this.messages.slice(
                    -1000
                );

        }

        this.updatedAt =
            new Date();

        next();

    }
);


// ======================================================
// EXPORT
// ======================================================

module.exports =
    mongoose.model(
        "SmartAssistantConversation",
        smartAssistantConversationSchema
    );

