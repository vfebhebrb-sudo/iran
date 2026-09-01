const mongoose = require("mongoose");


// =======================================
// Analysis Result Model
// نتیجه برای صفحه تحلیل آزمون
// =======================================


const AnalysisResultSchema = new mongoose.Schema({



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



    totalQuestions:{
        type:Number,
        default:0
    },


    answered:{
        type:Number,
        default:0
    },


    correct:{
        type:Number,
        default:0
    },


    wrong:{
        type:Number,
        default:0
    },


    unanswered:{
        type:Number,
        default:0
    },


    percent:{
        type:Number,
        default:0
    },



    // نمودار درس ها

    subjects:[

        {
            name:String,

            percent:{
                type:Number,
                default:0
            },

            correct:Number,

            wrong:Number

        }

    ],



    // تحلیل هوش مصنوعی

    ai:{


        message:{
            type:String,
            default:""
        },


        strengths:{
            type:[String],
            default:[]
        },


        weaknesses:{
            type:[String],
            default:[]
        },


        suggestions:{
            type:[String],
            default:[]
        }


    },



    createdAt:{
        type:Date,
        default:Date.now
    }



});



module.exports =
mongoose.model(
"AnalysisResult",
AnalysisResultSchema
);