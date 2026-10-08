const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


function pcmToWav(
    pcmData,
    sampleRate = 24000,
    channels = 1,
    bitsPerSample = 16
) {

    const byteRate =
        sampleRate *
        channels *
        bitsPerSample / 8;

    const blockAlign =
        channels *
        bitsPerSample / 8;

    const wavHeader =
        Buffer.alloc(44);

    wavHeader.write(
        "RIFF",
        0
    );

    wavHeader.writeUInt32LE(
        36 + pcmData.length,
        4
    );

    wavHeader.write(
        "WAVE",
        8
    );

    wavHeader.write(
        "fmt ",
        12
    );

    wavHeader.writeUInt32LE(
        16,
        16
    );

    wavHeader.writeUInt16LE(
        1,
        20
    );

    wavHeader.writeUInt16LE(
        channels,
        22
    );

    wavHeader.writeUInt32LE(
        sampleRate,
        24
    );

    wavHeader.writeUInt32LE(
        byteRate,
        28
    );

    wavHeader.writeUInt16LE(
        blockAlign,
        32
    );

    wavHeader.writeUInt16LE(
        bitsPerSample,
        34
    );

    wavHeader.write(
        "data",
        36
    );

    wavHeader.writeUInt32LE(
        pcmData.length,
        40
    );


    return Buffer.concat([
        wavHeader,
        pcmData
    ]);
}


async function geminiTTS(text) {

    const response =
        await ai.models.generateContent({

            model:
                "gemini-2.5-flash-preview-tts",

            contents: [
                {
                    parts: [
                        {
                            text: text
                        }
                    ]
                }
            ],

            config: {

                responseModalities: [
                    "AUDIO"
                ],

                speechConfig: {

                    voiceConfig: {

                        prebuiltVoiceConfig: {

                            voiceName: "Kore"

                        }

                    }

                }

            }

        });


    const audioData =
        response
            .candidates?.[0]
            ?.content?.parts?.[0]
            ?.inlineData?.data;


    if (!audioData) {

        throw new Error(
            "Gemini TTS audio was not returned"
        );

    }


    const pcm =
        Buffer.from(
            audioData,
            "base64"
        );


    return pcmToWav(pcm);
}


module.exports = geminiTTS;