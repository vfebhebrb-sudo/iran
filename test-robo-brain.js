require("dotenv").config();


const {
    getRoboContext,
    getKnownUserName
} = require("./services/roboBrain");



async function test(){


    const chatId =
    "7052996549";



    const name =
    await getKnownUserName(chatId);



    console.log(
        "NAME:",
        name
    );



    const context =
    await getRoboContext(chatId);



    console.log(
        "CONTEXT:"
    );


    console.log(context);


}


test();
