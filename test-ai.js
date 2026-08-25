require("dotenv").config();


const askAI = require("./services/ai");



async function test(){


    const answer = await askAI(
        "سلام، خودت را معرفی کن"
    );


    console.log(
        "AI:",
        answer
    );


}



test();