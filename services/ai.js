const OpenAI = require("openai");


const client = new OpenAI({

    apiKey:process.env.GAPGPT_KEY,

    baseURL:
    "https://api.gapgpt.app/v1"

});





async function askAI(message){


    const response =
    await client.chat.completions.create({

        model:"gpt-4o",


        messages:[

            {
                role:"system",

                content:
                "تو دستیار هوشمند سایت برنامه کنکور هستی. پاسخ‌ها را فارسی، کوتاه و مفید بده."
            },


            {
                role:"user",

                content:message
            }

        ]

    });



    return response
    .choices[0]
    .message
    .content;



}



module.exports = askAI;