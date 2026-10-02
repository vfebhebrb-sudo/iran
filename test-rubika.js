require("dotenv").config();

console.log("ENV LOADED");

try {

    const rubikaBot = require("./rubika/bot");

    console.log("RUBIKA FILE LOADED ✅");

    rubikaBot.startBot();

    console.log("RUBIKA BOT START CALLED ✅");


}
catch(error){

    console.log(
        "RUBIKA TEST ERROR ❌",
        error.message
    );

}