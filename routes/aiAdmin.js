const express = require("express");

const router = express.Router();


const {
    updateROBOSettings,
    getROBOSettings
}
=
require("../services/roboSettingsService");




// GET

router.get(
"/settings",
async(req,res)=>{

try{

const settings =
await getROBOSettings();


res.json({

apiKey:
settings.apiKey,

model:
settings.model,

provider:
settings.provider

});


}

catch(error){

res.status(500).json({

success:false

});

}

});





// UPDATE KEY

router.post(
"/settings",
async(req,res)=>{


try{


const {
apiKey
}
=
req.body;



if(!apiKey){

return res.status(400).json({

success:false,

message:"API KEY EMPTY"

});

}




const settings =
await updateROBOSettings(
apiKey
);



console.log(
"🤖 ROBO KEY UPDATED"
);



res.json({

success:true,

settings

});


}

catch(error){


console.error(
"ROBO UPDATE ERROR:",
error
);


res.status(500).json({

success:false,

error:error.message

});


}


});



module.exports = router;