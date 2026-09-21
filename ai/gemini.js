const { GoogleGenerativeAI } = require("@google/generative-ai");


const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);


const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite"
});



async function askGemini(text){

    try{

        const result =
        await model.generateContent(text);


        return result.response.text();


    }
    catch(error){

        console.log(
            "GEMINI ERROR:",
            error.message
        );


        return "❌ الان هوش مصنوعی در دسترس نیست.";

    }

}


module.exports = askGemini;