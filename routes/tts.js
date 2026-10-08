const express = require("express");
const router = express.Router();

const geminiTTS = require("../ai/geminiTTS");


router.post("/tts", async (req, res) => {

    try {

        const { text } = req.body;

        if (!text || !text.trim()) {

            return res.status(400).json({
                error: "متن ارسال نشده است"
            });

        }


        console.log("🔊 TTS REQUEST:", text);


        const audio =
            await geminiTTS(text);


        res.set({
            "Content-Type": "audio/wav",
            "Content-Length": audio.length
        });


        res.send(audio);


    } catch (error) {

        console.error("❌ TTS ROUTE ERROR:");
        console.error(error);

        res.status(500).json({
            error: "خطا در ساخت صدای فارسی"
        });

    }

});


module.exports = router;