const ROBOSettings = 
    require("../models/ROBOSettings");




// ======================================================
// 🤖 GET ROBO SETTINGS
// ======================================================

async function getROBOSettings(){


    let settings =
        await ROBOSettings.findOne();



    if(!settings){


        settings =
        await ROBOSettings.create({

            provider:
                "gapgpt",


            model:
                "gpt-4o",


            apiKey:
                process.env.GAPGPT_API_KEY || "",


            enabled:
                true

        });


    }



    // جلوگیری از خالی بودن تنظیمات

    if(!settings.model){

        settings.model =
            "gpt-4o";

    }


    if(!settings.provider){

        settings.provider =
            "gapgpt";

    }



    await settings.save();



    return settings;


}





// ======================================================
// 🔑 UPDATE API KEY
// ======================================================

async function updateROBOSettings(apiKey){


    let settings =
        await ROBOSettings.findOne();



    if(!settings){


        settings =
        new ROBOSettings({

            provider:
                "gapgpt",


            model:
                "gpt-4o",


            enabled:
                true

        });


    }



    settings.apiKey =
        apiKey;



    // اگر قبلاً پاک شده بود دوباره تنظیم شود

    if(!settings.model){

        settings.model =
            "gpt-4o";

    }


    if(!settings.provider){

        settings.provider =
            "gapgpt";

    }



    settings.updatedAt =
        new Date();



    await settings.save();



    console.log(
        "🤖 ROBO SETTINGS UPDATED",
        {
            provider:
                settings.provider,

            model:
                settings.model
        }
    );



    return settings;


}





module.exports = {


    getROBOSettings,


    updateROBOSettings


};