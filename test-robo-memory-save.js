require("dotenv").config();


const {
    saveMemory,
    getMemory,
    getUserName
} =
require("./services/roboMemoryService");





async function test(){


    try{


        // ==================================
        // کاربر اول داخل یک گروه
        // ==================================


        await saveMemory({


            chatId:"7052996549",


            userId:"111111",


            name:"امیر",


            username:"amir",


            message:"روبو سلام",


            answer:"سلام امیر 👋 من اینجام"


        });




        console.log(
            "✅ USER 1 SAVED"
        );






        // ==================================
        // کاربر دوم همان گروه
        // ==================================


        await saveMemory({


            chatId:"7052996549",


            userId:"222222",


            name:"علی",


            username:"ali",


            message:"روبو سلام",


            answer:"سلام علی 👋 من اینجام"


        });




        console.log(
            "✅ USER 2 SAVED"
        );







        // ==================================
        // خواندن حافظه امیر
        // ==================================


        const amirMemory =
        await getMemory(

            "7052996549",

            "111111"

        );



        console.log(
            "\n🧠 AMIR MEMORY:"
        );


        console.log(
            amirMemory
        );







        // ==================================
        // خواندن حافظه علی
        // ==================================


        const aliMemory =
        await getMemory(

            "7052996549",

            "222222"

        );



        console.log(
            "\n🧠 ALI MEMORY:"
        );


        console.log(
            aliMemory
        );








        // ==================================
        // تست اسم
        // ==================================


        const amirName =
        await getUserName(

            "7052996549",

            "111111"

        );



        const aliName =
        await getUserName(

            "7052996549",

            "222222"

        );



        console.log(
            "\n👤 NAMES:"
        );


        console.log(
            "Amir:",
            amirName
        );


        console.log(
            "Ali:",
            aliName
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