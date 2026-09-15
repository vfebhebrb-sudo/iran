const mongoose = require("mongoose");

const plannerAISettingsSchema = new mongoose.Schema(
    {
        enabled: {
            type: Boolean,
            default: false
        },

        provider: {
            type: String,
            enum: ["gemini", "openai"],
            default: "gemini"
        },

        gemini: {
            apiKey: {
                type: String,
                default: ""
            },

            model: {
                type: String,
                default: "gemini-2.5-flash"
            }
        },

        openai: {
            apiKey: {
                type: String,
                default: ""
            },

            model: {
                type: String,
                default: "gpt-5.4-mini"
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PlannerAISettings",
    plannerAISettingsSchema
);