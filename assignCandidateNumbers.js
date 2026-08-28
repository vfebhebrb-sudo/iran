
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("./models/User");
const Counter = require("./models/Counter");


// ======================================================
// LOAD ENV
// ======================================================

dotenv.config();


// ======================================================
// GENERATE CANDIDATE NUMBER
// ======================================================

async function getNextCandidateNumber() {

    const counter =
        await Counter.findOneAndUpdate(

            {
                name: "candidateNumber"
            },

            {
                $inc: {
                    sequence: 1
                }
            },

            {
                new: true,
                upsert: true
            }

        );


    return String(
        100000 + counter.sequence
    );
}


// ======================================================
// MAIN
// ======================================================

async function assignCandidateNumbers() {

    try {

        // ==============================================
        // CONNECT MONGODB
        // ==============================================

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB connected ✅"
        );


        // ==============================================
        // FIND OLD USERS
        // فقط کاربران تایید شده
        // که شماره داوطلبی ندارند
        // ==============================================

        const users =
            await User.find({

                verified: true,

                $or: [

                    {
                        candidateNumber: null
                    },

                    {
                        candidateNumber: {
                            $exists: false
                        }
                    }

                ]

            });


        console.log(
            `Users without candidate number: ${users.length}`
        );


        // ==============================================
        // ASSIGN NUMBERS
        // ==============================================

        for (const user of users) {


            // اگر به هر دلیلی شماره داشت
            // دوباره شماره نده

            if (user.candidateNumber) {

                continue;

            }


            const candidateNumber =
                await getNextCandidateNumber();


            user.candidateNumber =
                candidateNumber;


            await user.save();


            console.log(
                `Assigned ${candidateNumber} -> ${user.phone}`
            );

        }


        // ==============================================
        // FINISH
        // ==============================================

        console.log(
            "================================"
        );

        console.log(
            "Candidate numbers assigned ✅"
        );

        console.log(
            "================================"
        );


    }

    catch (error) {

        console.error(
            "ASSIGN CANDIDATE NUMBER ERROR:"
        );

        console.error(error);

    }

    finally {

        await mongoose.disconnect();

        console.log(
            "MongoDB disconnected"
        );

    }

}


// ======================================================
// RUN
// ======================================================

assignCandidateNumbers();

