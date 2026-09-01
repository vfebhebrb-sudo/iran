const mongoose = require("mongoose");


const ExamSubmissionSchema = new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },


    examId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Test",
        required:true
    },


    answers:{
        type:Object,
        default:{}
    },


    markedQuestions:{
        type:Array,
        default:[]
    },


    totalQuestions:{
        type:Number,
        default:0
    },


    answeredCount:{
        type:Number,
        default:0
    },


    remainingCount:{
        type:Number,
        default:0
    },


    submittedAt:{
        type:Date,
        default:Date.now
    }


});


module.exports =
mongoose.model(
"ExamSubmission",
ExamSubmissionSchema
);