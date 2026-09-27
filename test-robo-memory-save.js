require("dotenv").config();


const {
    saveMemory,
    getMemory
} =
require("./services/roboMemoryService");



async function test(){


    try{


        await saveMemory({

            chatId: "7052996549",

            name: "امیر",

            username: "amir",

            message: "روبو سلام",

            answer: "سلام امیر 👋 من اینجام"

        });



        console.log(
            "✅ MESSAGE SAVED"
        );



        const memory =
        await getMemory(
            "7052996549"
        );



        console.log(
            "🧠 MEMORY:",
            memory
        );



        process.exit();



    }
    catch(error){


        console.log(
            "❌ TEST ERROR:",
            error
        );


        process.exit(1);


    }


}



test();