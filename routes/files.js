const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const File = require("../models/File");

const router = express.Router();
const TEMP_DIR =
path.join(
    __dirname,
    "../temp-files"
);


if(!fs.existsSync(TEMP_DIR)){

    fs.mkdirSync(
        TEMP_DIR,
        {
            recursive:true
        }
    );

}

const TOKEN =
process.env.RUBIKA_TOKEN;


// =====================================================
// GET FILES
// =====================================================

router.get("/", async (req, res) => {

    try {

        const lesson =
        req.query.lesson;

        let filter = {};

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
            "❌ GET FILES ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            message:
            "خطا در دریافت فایل‌ها"

        });

    }

});

// =====================================================
// OPEN FILE
// =====================================================

router.get("/:id/open", async (req, res) => {

    try {


        const file =
        await File.findById(
            req.params.id
        );


        if(!file){

            return res.status(404).json({

                success:false,

                message:
                "فایل پیدا نشد"

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
        // اگر قبلا ذخیره شده بود
        // =========================================

        if(
            fs.existsSync(filePath)
        ){


            return res.json({

                success:true,

                url:
                `http://localhost:3000/temp-files/${fileName}`,

                file:{

                    id:file._id,

                    name:file.name,

                    lesson:file.lesson,

                    fileType:file.fileType,

                    size:file.size

                }

            });


        }




        // =========================================
        // گرفتن لینک از روبیکا
        // =========================================


        const rubikaResponse =
        await axios.post(


            `https://botapi.rubika.ir/v3/${TOKEN}/getFile`,


            {

                file_id:
                file.fileId

            },


            {

                timeout:15000

            }


        );



        const downloadUrl =
        rubikaResponse
        .data
        ?.data
        ?.download_url;



        if(!downloadUrl){


            return res.status(500).json({

                success:false,

                message:
                "لینک دانلود روبیکا دریافت نشد"

            });


        }




        // =========================================
        // دانلود فایل
        // =========================================


        const pdfResponse =
        await axios.get(

            downloadUrl,

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
        `temp-files/${fileName}`;


        file.tempCreatedAt =
        new Date();


        await file.save();




        // =========================================
        // ارسال آدرس به فرانت
        // =========================================


        res.json({

            success:true,


            url:
            `http://localhost:3000/temp-files/${fileName}`,



            file:{

                id:file._id,

                name:file.name,

                lesson:file.lesson,

                fileType:file.fileType,

                size:file.size

            }


        });



    }
    catch(error){


        console.error(

            "❌ OPEN FILE ERROR:",

            error.response?.data ||
            error.message

        );



        res.status(500).json({

            success:false,

            message:
            "خطا در باز کردن فایل"

        });


    }


});


module.exports = router;