const mongoose = require("mongoose");
const dns = require("dns");


dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);


let roboConnection = null;


async function connectRoboDatabase(){


    try{


        if(roboConnection){

            return roboConnection;

        }



        console.log(
            "ROBO URI:",
            process.env.ROBO_MONGO_URI
        );



        roboConnection =
        await mongoose.createConnection(

            process.env.ROBO_MONGO_URI,

            {

                serverSelectionTimeoutMS: 15000

            }

        ).asPromise();



        console.log(
            "🤖 ROBO MEMORY DATABASE CONNECTED ✅"
        );



        return roboConnection;



    }
    catch(error){


        console.log(
            "❌ ROBO DATABASE ERROR:"
        );


        console.log(
            error.message
        );


        throw error;


    }


}



module.exports =
connectRoboDatabase;