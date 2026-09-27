require("dotenv").config();

const connectRoboDatabase =
require("./database/roboDatabase");


async function test(){

    await connectRoboDatabase();

    console.log(
        "TEST FINISHED ✅"
    );

    process.exit();

}


test();