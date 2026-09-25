const mongoose = require("mongoose");

const ExamSubmissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Test",
            required: true,
            index: true
        },

        answers: {
            type: Object,
            default: {}
        },

        markedQuestions: {
            type: Array,
            default: []
        },

        totalQuestions: {
            type: Number,
            default: 0
        },

        answeredCount: {
            type: Number,
            default: 0
        },

        remainingCount: {
            type: Number,
            default: 0
        },

        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);


// جلوگیری قطعی از ثبت چندباره یک آزمون
// یک کاربر + یک آزمون = فقط یک Submission
ExamSubmissionSchema.index(
    {
        userId: 1,
        examId: 1
    },
    {
        unique: true
    }
);


module.exports = mongoose.model(
    "ExamSubmission",
    ExamSubmissionSchema
);