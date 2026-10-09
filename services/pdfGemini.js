"use strict";


const { GoogleGenAI } =
require("@google/genai");


const ai =
new GoogleGenAI({

    apiKey:
    process.env.GEMINI_API_KEY

});





async function askPdfGemini(

    text,

    question

){


    const result =

    await ai.models.generateContent({

        model:
        "gemini-2.0-flash",


        contents:[


            {

                role:"user",

                parts:[

                    {

                        text:

`
تو یک دستیار مطالعه هستی.

بر اساس متن PDF زیر جواب بده.

اگر جواب داخل فایل نبود بگو پیدا نشد.


متن PDF:

${text}



سؤال:

${question}

`

                    }

                ]

            }

        ]

    });



    return result.text;


}





module.exports = {

    askPdfGemini

};