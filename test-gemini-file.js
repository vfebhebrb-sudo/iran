require("dotenv").config();

const {
    uploadPdfToGemini
} = require("./services/geminiFileService");


async function test(){

    try{

        const result =
        await uploadPdfToGemini(
            "./temp-files/6abf6fdff27165d5523b35ac.pdf"
        );


        console.log(result);

    }

    catch(error){

        console.error(error);

    }

}


test();