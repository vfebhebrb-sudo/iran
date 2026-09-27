require("dotenv").config();


const {
    getRoboMemoryModel
} = require("./services/roboMemoryService");



async function test(){


    try{


        const Model =
        await getRoboMemoryModel();



        console.log(
            "🤖 ROBO MEMORY MODEL READY ✅"
        );


        console.log(
            "MODEL NAME:",
            Model.modelName
        );


        process.exit();



    }
    catch(error){


        console.log(
            "❌ MEMORY TEST ERROR:",
            error.message
        );


        process.exit(1);

    }


}



test();