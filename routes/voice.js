const express = require("express");

const router = express.Router();

const {
    createVoiceToken
} = require("../voice/voiceSession");

router.get("/token", async (req, res) => {

    try {

        const token =
            await createVoiceToken();

        res.json({
            success: true,
            token: token
        });

    } catch (error) {

        console.error(
            "❌ VOICE TOKEN ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            error: "خطا در ساخت توکن اتصال صوتی"
        });

    }

});


module.exports = router;