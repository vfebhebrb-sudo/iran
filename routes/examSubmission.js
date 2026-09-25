// =====================================================
// EXAM SUBMISSION ROUTER
// =====================================================

const express = require("express");

const router = express.Router();

const jwt = require("jsonwebtoken");

const ExamSubmission =
    require("../models/ExamSubmission");


// =====================================================
// HELPER
// دریافت کاربر از توکن
// =====================================================

function getUserFromToken(req) {

    const authHeader =
        req.headers.authorization;


    if (!authHeader) {

        return {
            error: "توکن ارسال نشده",
            status: 401
        };

    }


    const token =
        authHeader.split(" ")[1];


    if (!token) {

        return {
            error: "توکن نامعتبر",
            status: 401
        };

    }


    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        return {
            decoded
        };


    } catch (error) {

        return {
            error: "توکن نامعتبر یا منقضی شده",
            status: 401
        };

    }

}


// =====================================================
// CHECK EXAM SUBMISSION
// بررسی اینکه کاربر قبلاً در آزمون شرکت کرده یا نه
// =====================================================

router.get(
    "/check/:examId",
    async (req, res) => {

        try {

            console.log(
                "========== CHECK EXAM =========="
            );


            const examId =
                req.params.examId;


            console.log(
                "EXAM ID:",
                examId
            );


            // =============================================
            // TOKEN
            // =============================================

            const auth =
                getUserFromToken(req);


            if (auth.error) {

                return res.status(
                    auth.status
                ).json({

                    success: false,

                    message:
                        auth.error

                });

            }


            const userId =
                auth.decoded.userId;


            console.log(
                "USER ID:",
                userId
            );


            // =============================================
            // CHECK SUBMISSION
            // =============================================

            const submission =
                await ExamSubmission.findOne({

                    userId: userId,

                    examId: examId

                });


            // =============================================
            // ALREADY SUBMITTED
            // =============================================

            if (submission) {

                console.log(
                    "USER ALREADY SUBMITTED THIS EXAM"
                );


                return res.status(200).json({

                    success: true,

                    alreadySubmitted: true,

                    message:
                        "شما قبلاً در این آزمون شرکت کرده‌اید."

                });

            }


            // =============================================
            // NOT SUBMITTED
            // =============================================

            console.log(
                "USER HAS NOT SUBMITTED THIS EXAM"
            );


            return res.status(200).json({

                success: true,

                alreadySubmitted: false,

                message:
                    "کاربر می‌تواند در آزمون شرکت کند."

            });


        } catch (error) {

            console.log(
                "CHECK EXAM ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "خطا در بررسی وضعیت آزمون"

            });

        }

    }
);


// =====================================================
// SUBMIT EXAM ANSWERS
// ثبت پاسخ‌های آزمون
// =====================================================

router.post(
    "/submit",
    async (req, res) => {

        try {

            console.log(
                "========== SUBMIT EXAM =========="
            );


            console.log(
                "SUBMIT BODY:"
            );


            console.log(
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );


            console.log(
                "================================"
            );


            // =============================================
            // TOKEN
            // =============================================

            const auth =
                getUserFromToken(req);


            if (auth.error) {

                return res.status(
                    auth.status
                ).json({

                    success: false,

                    message:
                        auth.error

                });

            }


            const userId =
                auth.decoded.userId;


            // =============================================
            // DATA
            // =============================================

            const data =
                req.body;


            const examId =
                data.examId;


            // =============================================
            // CHECK EXAM ID
            // =============================================

            if (!examId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "شناسه آزمون ارسال نشده است."

                });

            }


            console.log(
                "USER ID:",
                userId
            );


            console.log(
                "EXAM ID:",
                examId
            );


            // =============================================
            // CHECK PREVIOUS SUBMISSION
            // =============================================

            const previousSubmission =
                await ExamSubmission.findOne({

                    userId: userId,

                    examId: examId

                });


            if (previousSubmission) {

                console.log(
                    "DUPLICATE SUBMISSION BLOCKED:",
                    previousSubmission._id
                );


                return res.status(409).json({

                    success: false,

                    alreadySubmitted: true,

                    message:
                        "شما قبلاً در این آزمون شرکت کرده‌اید."

                });

            }


            // =============================================
            // CONVERT ANSWERS OBJECT TO ARRAY
            // =============================================

            let answers = [];


            if (
                data.answers &&
                typeof data.answers === "object"
            ) {

                answers =
                    Object.keys(
                        data.answers
                    )

                    .sort(
                        (a, b) =>
                            Number(a) -
                            Number(b)
                    )

                    .map(
                        key =>
                            Number(
                                data.answers[key]
                            )
                    );

            }


            console.log(
                "FINAL ANSWERS BEFORE SAVE:",
                answers
            );


            // =============================================
            // CREATE SUBMISSION
            // =============================================

            const submission =
                new ExamSubmission({

                    userId:
                        userId,

                    examId:
                        examId,

                    answers:
                        answers,

                    markedQuestions:
                        Array.isArray(
                            data.markedQuestions
                        )
                            ?
                            data.markedQuestions
                            :
                            [],

                    totalQuestions:
                        Number(
                            data.totalQuestions
                        ) || 0,

                    answeredCount:
                        Number(
                            data.answeredCount
                        ) ||
                        answers.length,

                    remainingCount:
                        Number(
                            data.remainingCount
                        ) || 0

                });


            // =============================================
            // SAVE
            // =============================================

            await submission.save();


            console.log(
                "SUBMISSION SAVED:",
                submission._id
            );


            console.log(
                "SAVED ANSWERS:",
                submission.answers
            );


            // =============================================
            // SUCCESS RESPONSE
            // =============================================

            return res.status(201).json({

                success: true,

                message:
                    "پاسخ آزمون با موفقیت ثبت شد.",

                submission

            });


        } catch (error) {

            console.log(
                "SUBMIT ERROR:",
                error
            );


            // =============================================
            // DUPLICATE KEY
            // =============================================

            if (
                error.code === 11000
            ) {

                return res.status(409).json({

                    success: false,

                    alreadySubmitted: true,

                    message:
                        "شما قبلاً در این آزمون شرکت کرده‌اید."

                });

            }


            // =============================================
            // GENERAL ERROR
            // =============================================

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "خطا در ثبت آزمون"

            });

        }

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;