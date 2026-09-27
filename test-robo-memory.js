require("dotenv").config();

const {
    saveMemory,
    getMemory,
    getUserName
} = require("./models/RoboMemory");



async function test(){


    // کاربر اول
    await saveMemory({

        chatId:"GROUP_100",

        userId:"111",

        username:"amir",

        name:"امیرحسین",

        message:"سلام روبو اسم من امیرحسین است",

        answer:"سلام امیرحسین 👋"

    });



    // کاربر دوم
    await saveMemory({

        chatId:"GROUP_100",

        userId:"222",

        username:"ali",

        name:"علی",

        message:"سلام روبو اسم من علی است",

        answer:"سلام علی 👋"

    });




    console.log(
        "\n👤 USER 111:"
    );


    console.log(
        await getMemory(
            "GROUP_100",
            "111"
        )
    );




    console.log(
        "\n👤 USER 222:"
    );


    console.log(
        await getMemory(
            "GROUP_100",
            "222"
        )
    );



    console.log(
        "\nNAME TEST:"
    );


    console.log(
        await getUserName(
            "GROUP_100",
            "111"
        )
    );


    console.log(
        await getUserName(
            "GROUP_100",
            "222"
        )
    );



    process.exit();

}


test();