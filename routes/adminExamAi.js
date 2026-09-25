
const express = require("express");
const multer = require("multer");

const router = express.Router();


// =======================================
// SERVICES
// =======================================

const generateExam =
    require("../services/examAiService");

const analyzeAnswerPdf =
    require("../services/analyzeAnswerPdfService");


// =======================================
// MULTER
// =======================================

const upload =
    multer({

        storage:
            multer.memoryStorage(),

        limits: {

            fileSize:
                15 * 1024 * 1024

        }

    });


// =======================================
// GENERATE EXAM
// =======================================

router.post(
    "/generate-exam",

    async (req, res) => {

        try {

            const {
                title,
                subject,
                questionCount,
                answerKey
            } = req.body;


            // ===============================
            // TITLE
            // ===============================

            if (
                !title ||
                !title.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "عنوان آزمون وارد نشده است"

                });

            }


            // ===============================
            // SUBJECT
            // ===============================

            if (
                !subject ||
                !subject.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "درس آزمون وارد نشده است"

                });

            }


            // ===============================
            // QUESTION COUNT
            // ===============================

            const count =
                Number(questionCount);


            if (
                !Number.isInteger(count) ||
                count < 1
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "تعداد سؤال نامعتبر است"

                });

            }


            // ===============================
            // ANSWER KEY
            // ===============================

            if (
                !Array.isArray(answerKey) ||
                answerKey.length !== count
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "پاسخنامه کامل نیست"

                });

            }


            // ===============================
            // VALIDATE ANSWERS
            // ===============================

            for (
                let i = 0;
                i < answerKey.length;
                i++
            ) {

                const answer =
                    Number(answerKey[i]);


                if (
                    !Number.isInteger(answer) ||
                    answer < 1 ||
                    answer > 4
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            `پاسخ سؤال ${i + 1} باید بین 1 تا 4 باشد`

                    });

                }

            }


            // ===============================
            // GENERATE
            // ===============================

            const result =
                await generateExam({

                    title:
                        title.trim(),

                    subject:
                        subject.trim(),

                    questionCount:
                        count,

                    answerKey

                });


            // ===============================
            // RESPONSE
            // ===============================

            return res.status(200).json({

                success: true,

                message:
                    "آزمون با موفقیت توسط Gemini ساخته شد",

                questionCount:
                    result.questions.length,

                questions:
                    result.questions

            });

        }

        catch (error) {

            console.log(
                "GENERATE EXAM ROUTE ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "خطا در ساخت آزمون با هوش مصنوعی"

            });

        }

    }
);


// =======================================
// ANALYZE ANSWER PDF
// =======================================

router.post(

    "/analyze-answer-pdf",

    upload.single("answerSheet"),

    async (req, res) => {

        try {


            // ===============================
            // CHECK FILE
            // ===============================

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    message:
                        "فایل PDF پاسخنامه ارسال نشده است"

                });

            }


            // ===============================
            // CHECK PDF
            // ===============================

            if (
                req.file.mimetype !==
                "application/pdf"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "فقط فایل PDF قابل قبول است"

                });

            }


            // ===============================
            // LOG FILE
            // ===============================

            console.log(
                "ANSWER PDF RECEIVED:",
                req.file.originalname
            );

            console.log(
                "PDF SIZE:",
                req.file.size
            );


            // ===============================
            // ANALYZE PDF
            // ===============================

            const result =
                await analyzeAnswerPdf(
                    req.file.buffer
                );


            // ===============================
            // RESPONSE
            // ===============================

            return res.status(200).json({

                success: true,

                message:
                    "پاسخنامه با موفقیت تحلیل شد",

                questionCount:
                    result.questionCount,

                answerKey:
                    result.answerKey

            });

        }

        catch (error) {

            console.log(
                "ANALYZE ANSWER PDF ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "خطا در تحلیل پاسخنامه"

            });

        }

    }

);


// =======================================
// EXPORT
// =======================================

module.exports = router;

