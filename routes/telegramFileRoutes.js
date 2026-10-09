
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const File = require("../models/File");

const authenticateUser =
    require("../middleware/auth");

const specialUser =
    require("../middleware/specialUser");

const router = express.Router();


// =====================================================
// TEMP DIRECTORY
// =====================================================

const TEMP_DIR =
    path.join(
        __dirname,
        "../temp-files/telegram"
    );


if (!fs.existsSync(TEMP_DIR)) {

    fs.mkdirSync(
        TEMP_DIR,
        {
            recursive: true
        }
    );

}


// =====================================================
// TELEGRAM TOKEN
// =====================================================

const TOKEN =
    process.env.TELEGRAM_FILE_BOT_TOKEN;


const TELEGRAM_API =
    `https://api.telegram.org/bot${TOKEN}`;


const TELEGRAM_FILE_API =
    `https://api.telegram.org/file/bot${TOKEN}`;



// =====================================================
// GET TELEGRAM FILES
// =====================================================

router.get("/", async (req, res) => {

    try {

        const lesson =
            req.query.lesson;


        let filter = {
            source: "telegram"
        };


        if (lesson) {

            filter.lesson = lesson;

        }


        const files =
            await File
                .find(filter)
                .sort({
                    createdAt: -1
                })
                .lean();


        const result =
            files.map(file => ({

                id: file._id,

                name: file.name,

                lesson: file.lesson,

                fileId: file.fileId,

                fileType: file.fileType,

                size: file.size,

                createdAt: file.createdAt

            }));


        res.json({

            success: true,

            count: result.length,

            files: result

        });


    } catch (error) {

        console.error(
            "❌ GET TELEGRAM FILES ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "خطا در دریافت فایل‌های تلگرام"

        });

    }

});



// =====================================================
// PDF FOR PDF.JS VIEWER
// =====================================================

router.get("/:id/pdf", async (req, res) => {

    try {

        const file =
            await File.findOne({

                _id: req.params.id,

                source: "telegram"

            });


        if (!file) {

            return res.status(404).json({

                success: false,

                message:
                    "فایل تلگرام پیدا نشد"

            });

        }


        const fileName =
            `${file._id}.pdf`;


        const filePath =
            path.join(
                TEMP_DIR,
                fileName
            );



        // =========================================
        // اگر قبلاً دانلود شده
        // =========================================

        if (fs.existsSync(filePath)) {

            return res.sendFile(
                filePath
            );

        }



        // =========================================
        // گرفتن file_path از Telegram
        // =========================================

        const telegramResponse =
            await axios.post(

                `${TELEGRAM_API}/getFile`,

                {

                    file_id:
                        file.fileId

                },

                {

                    timeout: 15000

                }

            );


        const filePathTelegram =
            telegramResponse
                .data
                ?.result
                ?.file_path;


        if (!filePathTelegram) {

            return res.status(500).json({

                success: false,

                message:
                    "مسیر فایل از تلگرام دریافت نشد"

            });

        }



        // =========================================
        // دانلود PDF از Telegram
        // =========================================

        const pdfResponse =
            await axios.get(

                `${TELEGRAM_FILE_API}/${filePathTelegram}`,

                {

                    responseType:
                        "arraybuffer",

                    timeout:
                        60000

                }

            );


        fs.writeFileSync(

            filePath,

            pdfResponse.data

        );



        // =========================================
        // ذخیره مسیر موقت در MongoDB
        // =========================================

        file.tempPath =
            `temp-files/telegram/${fileName}`;

        file.tempCreatedAt =
            new Date();

        await file.save();



        // =========================================
        // ارسال PDF به PDF.js
        // =========================================

        res.sendFile(
            filePath
        );


    }
    catch (error) {

        console.error(

            "❌ TELEGRAM PDF VIEW ERROR:",

            error.response?.data ||
            error.message

        );


        res.status(500).json({

            success: false,

            message:
                "خطا در دریافت PDF از تلگرام"

        });

    }

});



// =====================================================
// OPEN TELEGRAM FILE
// =====================================================

router.get("/:id/open", async (req, res) => {

    try {

        const file =
            await File.findOne({

                _id: req.params.id,

                source: "telegram"

            });


        if (!file) {

            return res.status(404).json({

                success: false,

                message:
                    "فایل تلگرام پیدا نشد"

            });

        }



        const fileName =
            `${file._id}.pdf`;


        const filePath =
            path.join(
                TEMP_DIR,
                fileName
            );



        // =========================================
        // اگر قبلاً ذخیره شده بود
        // =========================================

        if (
            fs.existsSync(filePath)
        ) {

            return res.json({

                success: true,

                url:
                    `${process.env.SERVER_URL}/temp-files/telegram/${fileName}`,

                file: {

                    id: file._id,

                    name: file.name,

                    lesson: file.lesson,

                    fileType: file.fileType,

                    size: file.size

                }

            });

        }



        // =========================================
        // گرفتن file_path از Telegram
        // =========================================

        const telegramResponse =
            await axios.post(

                `${TELEGRAM_API}/getFile`,

                {

                    file_id:
                        file.fileId

                },

                {

                    timeout: 15000

                }

            );


        const filePathTelegram =
            telegramResponse
                .data
                ?.result
                ?.file_path;


        if (!filePathTelegram) {

            return res.status(500).json({

                success: false,

                message:
                    "مسیر فایل از تلگرام دریافت نشد"

            });

        }



        // =========================================
        // دانلود فایل
        // =========================================

        const pdfResponse =
            await axios.get(

                `${TELEGRAM_FILE_API}/${filePathTelegram}`,

                {

                    responseType:
                        "arraybuffer",

                    timeout:
                        60000

                }

            );


        fs.writeFileSync(

            filePath,

            pdfResponse.data

        );



        // =========================================
        // ذخیره مسیر موقت در MongoDB
        // =========================================

        file.tempPath =
            `temp-files/telegram/${fileName}`;

        file.tempCreatedAt =
            new Date();

        await file.save();



        // =========================================
        // ارسال آدرس به فرانت
        // =========================================

        res.json({

            success: true,

            url:
                `${process.env.SERVER_URL}/temp-files/telegram/${fileName}`,

            file: {

                id: file._id,

                name: file.name,

                lesson: file.lesson,

                fileType: file.fileType,

                size: file.size

            }

        });


    }
    catch (error) {

        console.error(

            "❌ TELEGRAM OPEN FILE ERROR:",

            error.response?.data ||
            error.message

        );


        res.status(500).json({

            success: false,

            message:
                "خطا در باز کردن فایل تلگرام"

        });

    }

});



// =====================================================
// DELETE TELEGRAM FILE — SPECIAL USER ONLY
// =====================================================

router.delete(

    "/:id",

    authenticateUser,

    specialUser,

    async (req, res) => {

        try {

            const file =
                await File.findOne({

                    _id: req.params.id,

                    source: "telegram"

                });


            if (!file) {

                return res.status(404).json({

                    success: false,

                    message:
                        "فایل تلگرام پیدا نشد"

                });

            }



            // -----------------------------------------
            // حذف PDF ذخیره‌شده
            // -----------------------------------------

            const fileName =
                `${file._id}.pdf`;


            const filePath =
                path.join(
                    TEMP_DIR,
                    fileName
                );


            if (fs.existsSync(filePath)) {

                fs.unlinkSync(filePath);

                console.log(
                    "🗑️ TELEGRAM TEMP PDF DELETED:",
                    fileName
                );

            }



            // -----------------------------------------
            // حذف رکورد MongoDB
            // -----------------------------------------
            console.log(
    "📄 REQUEST PDF ID:",
    req.params.id
);

            await File.findByIdAndDelete(
                req.params.id
            );


            console.log(
                "🗑️ TELEGRAM FILE DELETED:",
                file.name
            );


            return res.json({

                success: true,

                message:
                    "فایل تلگرام با موفقیت حذف شد",

                file: {

                    id: file._id,

                    name: file.name

                }

            });


        }
        catch (error) {

            console.error(

                "❌ DELETE TELEGRAM FILE ERROR:",

                error

            );


            return res.status(500).json({

                success: false,

                message:
                    "خطا در حذف فایل تلگرام"

            });

        }

    }

);


module.exports = router;
