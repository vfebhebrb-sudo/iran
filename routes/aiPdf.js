const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { GoogleGenAI } = require("@google/genai");

const PDFSession = require("../models/PDFSession");

const router = express.Router();


// ======================================================
// GEMINI
// ======================================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ======================================================
// TEMP PDF DIRECTORY
// ======================================================

const TEMP_DIR = path.join(
    __dirname,
    "../temp-files/pdf"
);

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, {
        recursive: true
    });
}


// ======================================================
// MULTER
// ======================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, TEMP_DIR);
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            crypto.randomBytes(6).toString("hex") +
            ".pdf";

        cb(null, uniqueName);
    }

});


const upload = multer({

    storage,

    limits: {
        fileSize: 50 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        if (file.mimetype !== "application/pdf") {

            return cb(
                new Error("فقط فایل PDF مجاز است.")
            );

        }

        cb(null, true);
    }

});


// ======================================================
// CREATE SESSION ID
// ======================================================

function createSessionId() {

    return (
        crypto.randomUUID() +
        "-" +
        crypto.randomBytes(4).toString("hex")
    );

}


// ======================================================
// UPLOAD PDF
// ======================================================

router.post(
    "/pdf/upload",
    upload.single("pdf"),
    async (req, res) => {

        let localFilePath = null;

        try {

            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message: "فایل PDF ارسال نشده است."
                });

            }


            localFilePath = req.file.path;


            console.log(
                "📄 PDF received:",
                req.file.originalname
            );


            // ==================================================
            // UPLOAD TO GEMINI
            // ==================================================

            console.log(
                "📤 Uploading PDF to Gemini..."
            );


            const uploadedFile =
                await ai.files.upload({

                    file: localFilePath,

                    config: {
                        mimeType: "application/pdf",
                        displayName: req.file.originalname
                    }

                });


            console.log(
                "✅ Gemini file:",
                uploadedFile.name
            );


            // ==================================================
            // WAIT FOR PROCESSING
            // ==================================================

            let fileInfo = uploadedFile;


            while (
                fileInfo.state &&
                fileInfo.state.toString() === "PROCESSING"
            ) {

                await new Promise(resolve =>
                    setTimeout(resolve, 1500)
                );


                fileInfo =
                    await ai.files.get({
                        name: uploadedFile.name
                    });

            }


            if (
                fileInfo.state &&
                fileInfo.state.toString() === "FAILED"
            ) {

                throw new Error(
                    "پردازش PDF توسط Gemini شکست خورد."
                );

            }


            // ==================================================
            // CREATE SESSION
            // ==================================================

            const sessionId =
                createSessionId();


            // Session بعد از 24 ساعت منقضی می‌شود
            const expiresAt =
                new Date(
                    Date.now() +
                    24 * 60 * 60 * 1000
                );


            const session =
                await PDFSession.create({

                    sessionId,

                    fileName:
                        fileInfo.name,

                    fileUri:
                        fileInfo.uri,

                    mimeType:
                        fileInfo.mimeType ||
                        "application/pdf",

                    originalName:
                        req.file.originalname,

                    createdAt:
                        new Date(),

                    lastUsedAt:
                        new Date(),

                    expiresAt

                });


            console.log(
                "🧠 PDF SESSION CREATED:",
                session.sessionId
            );


            // ==================================================
            // DELETE LOCAL FILE
            // ==================================================

            try {

                if (
                    localFilePath &&
                    fs.existsSync(localFilePath)
                ) {

                    fs.unlinkSync(
                        localFilePath
                    );

                }

            } catch (error) {

                console.warn(
                    "⚠️ Could not delete local PDF:",
                    error.message
                );

            }


            // ==================================================
            // RESPONSE
            // ==================================================

            return res.json({

                success: true,

                sessionId:
                    session.sessionId,

                fileName:
                    session.fileName,

                originalName:
                    session.originalName,

                message:
                    "PDF با موفقیت آماده شد."

            });


        } catch (error) {

            console.error(
                "❌ PDF UPLOAD ERROR:",
                error
            );


            // حذف فایل موقت در صورت خطا

            try {

                if (
                    localFilePath &&
                    fs.existsSync(localFilePath)
                ) {

                    fs.unlinkSync(
                        localFilePath
                    );

                }

            } catch (_) {}


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "خطا در آپلود PDF"

            });

        }

    }
);


// ======================================================
// ASK PDF
// ======================================================

router.post(
    "/pdf/chat",
    express.json(),
    async (req, res) => {

        try {

            const {
                sessionId,
                message
            } = req.body;


            if (!sessionId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "شناسه PDF ارسال نشده است."

                });

            }


            if (
                !message ||
                !message.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "سؤال خالی است."

                });

            }


            // ==================================================
            // FIND SESSION IN MONGODB
            // ==================================================

            const session =
                await PDFSession.findOne({
                    sessionId
                });


            if (!session) {

                return res.status(404).json({

                    success: false,

                    message:
                        "جلسه PDF پیدا نشد یا منقضی شده است."

                });

            }


            // ==================================================
            // CHECK EXPIRATION
            // ==================================================

            if (
                session.expiresAt &&
                session.expiresAt < new Date()
            ) {

                await deletePDFSession(
                    session
                );


                return res.status(410).json({

                    success: false,

                    message:
                        "جلسه PDF منقضی شده است."

                });

            }


            console.log(
                "💬 PDF QUESTION:",
                message.trim()
            );


            // ==================================================
            // ASK GEMINI
            // ==================================================

            const response =
                await ai.models.generateContent({

                    model:
                        "gemini-3.8-flash",

                    contents: [

                        {

                            role: "user",

                            parts: [

                                {

                                    fileData: {

                                        fileUri:
                                            session.fileUri,

                                        mimeType:
                                            session.mimeType

                                    }

                                },

                                {

                                    text:
                                        `تو یک دستیار هوشمند هستی که باید فقط بر اساس محتوای PDF زیر به سؤال کاربر پاسخ بدهی.

اگر پاسخ سؤال در PDF وجود ندارد، صادقانه بگو که اطلاعات لازم در PDF پیدا نشد.

سؤال کاربر:

${message.trim()}`
                                }

                            ]

                        }

                    ]

                });


            const reply =
                response.text ||
                "نتوانستم پاسخی از PDF پیدا کنم.";


            // ==================================================
            // UPDATE SESSION
            // ==================================================

            session.lastUsedAt =
                new Date();

            // هر بار استفاده، 24 ساعت دیگر تمدید می‌شود
            session.expiresAt =
                new Date(
                    Date.now() +
                    24 * 60 * 60 * 1000
                );

            await session.save();


            return res.json({

                success: true,

                reply

            });


        } catch (error) {

            console.error(
                "❌ PDF CHAT ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "خطا در پردازش سؤال PDF"

            });

        }

    }
);


// ======================================================
// DELETE PDF SESSION
// ======================================================

async function deletePDFSession(session) {

    try {

        console.log(
            "🗑️ Deleting Gemini file:",
            session.fileName
        );


        // حذف فایل از Gemini

        try {

            await ai.files.delete({
                name: session.fileName
            });

            console.log(
                "✅ Gemini file deleted"
            );

        } catch (error) {

            console.warn(
                "⚠️ Gemini file delete failed:",
                error.message
            );

        }


        // حذف Session از MongoDB

        await PDFSession.deleteOne({
            _id: session._id
        });


        console.log(
            "✅ MongoDB PDF session deleted:",
            session.sessionId
        );


    } catch (error) {

        console.error(
            "❌ SESSION DELETE ERROR:",
            error
        );

    }

}


// ======================================================
// CLOSE PDF SESSION
// ======================================================

router.post(
    "/pdf/close",
    express.json(),
    async (req, res) => {

        try {

            const {
                sessionId
            } = req.body;


            if (!sessionId) {

                return res.json({
                    success: true
                });

            }


            const session =
                await PDFSession.findOne({
                    sessionId
                });


            if (!session) {

                return res.json({

                    success: true,

                    message:
                        "Session already closed."

                });

            }


            await deletePDFSession(
                session
            );


            return res.json({

                success: true,

                message:
                    "PDF session closed."

            });


        } catch (error) {

            console.error(
                "❌ CLOSE PDF ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }
);


// ======================================================
// CLEANUP EXPIRED SESSIONS
// ======================================================

async function cleanupExpiredPDFSessions() {

    try {

        const expiredSessions =
            await PDFSession.find({

                expiresAt: {
                    $lte: new Date()
                }

            });


        if (
            expiredSessions.length === 0
        ) {

            return;

        }


        console.log(
            `🧹 Found ${expiredSessions.length} expired PDF session(s)`
        );


        for (
            const session
            of expiredSessions
        ) {

            await deletePDFSession(
                session
            );

        }


    } catch (error) {

        console.error(
            "❌ PDF CLEANUP ERROR:",
            error
        );

    }

}


// هر 5 دقیقه Sessionهای رهاشده بررسی شوند
setInterval(
    cleanupExpiredPDFSessions,
    5 * 60 * 1000
);


// ======================================================
// MULTER ERROR HANDLER
// ======================================================

router.use(
    (error, req, res, next) => {

        if (
            error instanceof multer.MulterError
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        if (error) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        next();

    }
);







router.get("/pdf/list-files", async (req, res) => {
    try {
        const entries = await fs.promises.readdir(
            TEMP_DIR,
            { withFileTypes: true }
        );

        const files = entries
            .filter(entry =>
                entry.isFile() &&
                path.extname(entry.name).toLowerCase() === ".pdf"
            )
            .map(entry => entry.name);

        res.json({
            success: true,
            files
        });

    } catch (error) {
        console.error("PDF LIST ERROR:", error);

        res.status(500).json({
            success: false,
            message: "خواندن فهرست فایل‌های PDF ناموفق بود."
        });
    }
});

module.exports = router;