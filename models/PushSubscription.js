
// ======================================================
// PUSH SUBSCRIPTION MODEL
// ======================================================

const mongoose = require("mongoose");


// ======================================================
// SCHEMA
// ======================================================

const pushSubscriptionSchema = new mongoose.Schema(

    {

        // ------------------------------------------
        // User
        // ------------------------------------------

        userId: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true,

            index: true

        },


        // ------------------------------------------
        // Web Push Endpoint
        // ------------------------------------------

        endpoint: {

            type: String,

            required: true,

            unique: true

        },


        // ------------------------------------------
        // Push Keys
        // ------------------------------------------

        keys: {

            p256dh: {

                type: String,

                required: true

            },

            auth: {

                type: String,

                required: true

            }

        },


        // ------------------------------------------
        // Browser / Device Information
        // ------------------------------------------

        userAgent: {

            type: String,

            default: ""

        },


        // ------------------------------------------
        // Last Usage
        // ------------------------------------------

        lastUsedAt: {

            type: Date,

            default: Date.now

        },


        // ------------------------------------------
        // Active
        // ------------------------------------------

        active: {

            type: Boolean,

            default: true,

            index: true

        }

    },

    {

        timestamps: true

    }

);


// ======================================================
// MODEL
// ======================================================

module.exports =
    mongoose.model(
        "PushSubscription",
        pushSubscriptionSchema
    );

