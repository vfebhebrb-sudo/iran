const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("./models/User");

dotenv.config();


async function fixOldCandidateNumbers(){

    try{

        await mongoose.connect(
            process.env.MONGO_URI
        );


        console.log(
            "MongoDB connected ✅"
        );


        const users =
            await User.find({
                candidateNumber:{
                    $exists:true
                }
            });


        console.log(
            "Users found:",
            users.length
        );


        for(const user of users){


            if(!user.candidateNumber){
                continue;
            }


            const oldNumber =
                Number(user.candidateNumber);


            // فقط شماره های خراب مثل 1،2،3
            if(oldNumber < 10000){


                user.candidateNumber =
                    String(
                        100000 + oldNumber
                    );


                await user.save();


                console.log(
                    "Fixed:",
                    user.phone,
                    "=>",
                    user.candidateNumber
                );

            }


        }


        console.log(
            "All candidate numbers fixed ✅"
        );


    }
    catch(error){

        console.log(
            "ERROR:",
            error
        );

    }
    finally{

        await mongoose.disconnect();

        console.log(
            "Disconnected"
        );

    }

}


fixOldCandidateNumbers();