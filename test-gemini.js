require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");


const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);


const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite"
});

async function test(){

    try{

        const result =
        await model.generateContent(
            "سلام، خودت را معرفی کن"
        );


        const text =
        result.response.text();


        console.log("\n🤖 GEMINI:");
        console.log(text);


    }catch(error){

        console.log(
            "❌ ERROR:",
            error.message
        );

    }

}


test();