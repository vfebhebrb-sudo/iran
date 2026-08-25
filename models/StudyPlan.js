const mongoose = require("mongoose");


const studyPlanSchema = new mongoose.Schema({


    // شماره تلفن صاحب برنامه
    phone: {

        type: String,

        required: true

    },


    // روز هفته
    day: {

        type: String,

        required: true

    },


    // نوع درس
    subject: {

        type: String,

        required: true

    },


    // نام نمایشی درس
    subjectName: {

        type: String,

        required: true

    },


    // آیکون درس
    icon: {

        type: String,

        default: "book-open"

    },


    // رنگ کارت
    color: {

        type: String,

        default: "#6366f1"

    },


    // مبحث
    title: {

        type: String,

        required: true

    },


    // یادداشت
    note: {

        type: String,

        default: ""

    },


    // زمان مطالعه به دقیقه
    duration: {

        type: Number,

        required: true

    },


    // انجام شده؟
    completed: {

        type: Boolean,

        default: false

    },


    createdAt: {

        type: Date,

        default: Date.now

    }


});


module.exports =
mongoose.model("StudyPlan", studyPlanSchema);