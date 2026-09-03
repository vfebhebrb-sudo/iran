const OpenAI = require("openai");


function createAIClient(){


    const provider =
        process.env.AI_PROVIDER || "gapgpt";


    let config = {};
    let model = "";



    switch(provider){


        // =========================
        // OpenAI
        // =========================

        case "openai":

            config = {

                apiKey:
                    process.env.OPENAI_API_KEY,

                baseURL:
                    "https://api.openai.com/v1"

            };


            model =
                process.env.OPENAI_MODEL ||
                "gpt-4o-mini";


        break;



        // =========================
        // Gemini
        // =========================

case "gemini":

    config = {

        apiKey:
            process.env.GEMINI_API_KEY,

        baseURL:
            "https://generativelanguage.googleapis.com/v1beta/openai/"

    };


    model =
        process.env.GEMINI_MODEL ||
        "gemini-2.0-flash";

break;


        // =========================
        // GapGPT
        // =========================

        case "gapgpt":

            config = {

                apiKey:
                    process.env.GAPGPT_API_KEY,

                baseURL:
                    "https://api.gapgpt.app/v1"

            };


            model =
                process.env.GAPGPT_MODEL ||
                "gpt-4o";


        break;



        default:

            throw new Error(
                "AI Provider شناخته نشد"
            );

    }



    return {

        client:
            new OpenAI(config),

        model,

        provider

    };


}



module.exports =
    createAIClient;