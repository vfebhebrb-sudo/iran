const mongoose = require("mongoose");


const ExamResultSchema = new mongoose.Schema({

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


    title:{
        type:String,
        default:""
    },


    subject:{
        type:String,
        default:""
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


    answeredQuestions:{
        type:Number,
        default:0
    },


    correctAnswers:{
        type:Number,
        default:0
    },


    wrongAnswers:{
        type:Number,
        default:0
    },


    unanswered:{
        type:Number,
        default:0
    },


    score:{
        type:Number,
        default:0
    },


    duration:{
        type:Number,
        default:0
    },


    aiAnalysis:{


        biology:{
            type:Number,
            default:0
        },


        math:{
            type:Number,
            default:0
        },


        physics:{
            type:Number,
            default:0
        },


        chemistry:{
            type:Number,
            default:0
        },


        message:{
            type:String,
            default:""
        }


    },


    status:{
        type:String,
        default:"submitted"
    },


    submittedAt:{
        type:Date,
        default:Date.now
    }


});


module.exports =
mongoose.model(
"ExamResult",
ExamResultSchema
);