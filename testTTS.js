require("dotenv").config();

const fs = require("fs");

const geminiTTS = require("./ai/geminiTTS");

async function test() {

    try {

        console.log("🔊 شروع تست Gemini TTS...");

        const audio =
            await geminiTTS(
                "سلام، من ربات هوشمند شما هستم. این یک تست صدای فارسی است."
            );

        fs.writeFileSync(
            "test-voice.wav",
            audio
        );

        console.log(
            "✅ فایل صوتی ساخته شد:"
        );

        console.log(
            "📁 test-voice.wav"
        );

    }

    catch (error) {

        console.error(
            "❌ TTS ERROR:"
        );

        console.error(
            error.message
        );

    }

}

test();