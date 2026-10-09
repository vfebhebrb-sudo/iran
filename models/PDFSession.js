const mongoose = require("mongoose");

const pdfSessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        fileName: {
            type: String,
            required: true
        },

        fileUri: {
            type: String,
            required: true
        },

        mimeType: {
            type: String,
            default: "application/pdf"
        },

        originalName: {
            type: String,
            required: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        lastUsedAt: {
            type: Date,
            default: Date.now
        },

        expiresAt: {
            type: Date,
            required: true,
            index: true
        }
    }
);

module.exports = mongoose.model("PDFSession", pdfSessionSchema);