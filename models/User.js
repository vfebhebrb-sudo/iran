
const mongoose = require("mongoose");


// ======================================================
// USER SCHEMA
// ======================================================

const userSchema = new mongoose.Schema({

    // ====================================================
    // BASIC USER INFORMATION
    // ====================================================

    fullname: {
        type: String,
        default: null,
        trim: true
    },

    email: {
        type: String,
        default: null,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        default: null
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },


    // ====================================================
    // CANDIDATE INFORMATION
    // ====================================================

    /*
        شماره داوطلبی بعد از تأیید OTP
        و ساخت موفق حساب ایجاد می‌شود.
    */

    candidateNumber: {
        type: String,
        unique: true,
        sparse: true,
        default: null,
        trim: true
    },


    // ====================================================
    // USER STATISTICS
    // ====================================================

    studyDays: {
        type: Number,
        default: 0,
        min: 0
    },

    league: {
        type: String,
        default: "برنز",
        trim: true
    },

    completedExams: {
        type: Number,
        default: 0,
        min: 0
    },

    previousScore: {
        type: Number,
        default: 0,
        min: 0
    },


    // ====================================================
    // USER PROFILE
    // ====================================================

    profileImage: {
        type: String,
        default: null,
        trim: true
    },

    bio: {
        type: String,
        default: null,
        trim: true
    },


    // ====================================================
    // STUDY / TARGET INFORMATION
    // ====================================================

    targetField: {
        type: String,
        default: null,
        trim: true
    },

    targetUniversity: {
        type: String,
        default: null,
        trim: true
    },


    // ====================================================
    // EXAM PROGRESS
    // ====================================================

    totalQuestionsAnswered: {
        type: Number,
        default: 0,
        min: 0
    },

    totalCorrectAnswers: {
        type: Number,
        default: 0,
        min: 0
    },

    totalWrongAnswers: {
        type: Number,
        default: 0,
        min: 0
    },


    // ====================================================
    // STUDY TIME
    // ====================================================

    totalStudyMinutes: {
        type: Number,
        default: 0,
        min: 0
    },


    // ====================================================
    // MESSAGING / RUBIKA
    // ====================================================

    chatId: {
        type: String,
        default: null,
        trim: true
    },


    // ====================================================
    // OTP
    // ====================================================

    otp: {
        type: String,
        default: null
    },

    otpExpire: {
        type: Date,
        default: null
    },


    // ====================================================
    // ACCOUNT STATUS
    // ====================================================

    verified: {
        type: Boolean,
        default: false
    },

    isActive: {
        type: Boolean,
        default: true
    },


    // ====================================================
    // ACCOUNT DATES
    // ====================================================

    lastLoginAt: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});


// ======================================================
// EXPORT MODEL
// ======================================================

module.exports = mongoose.model(
    "User",
    userSchema
);

