const express = require("express");

const router = express.Router();

const jwt = require("jsonwebtoken");

const AnalysisResult =
require("../models/AnalysisResult");





// =================================
// GET LAST ANALYSIS
// =================================


router.get(
"/latest",
async(req,res)=>{


try{


const authHeader =
req.headers.authorization;


if(!authHeader){

return res.status(401).json({

success:false,

message:"توکن وجود ندارد"

});

}



const token =
authHeader.split(" ")[1];



const decoded =
jwt.verify(
token,
process.env.JWT_SECRET
);



const result =
await AnalysisResult.findOne({

userId:decoded.userId

})
.sort({

createdAt:-1

});



res.json({

success:true,

result

});



}
catch(error){


console.log(
"ANALYSIS ERROR:",
error
);



res.status(500).json({

success:false,

message:error.message

});


}


});





// =================================
// CREATE ANALYSIS RESULT
// ذخیره نتیجه تحلیل
// =================================


router.post(
"/create",
async(req,res)=>{


try{


const authHeader =
req.headers.authorization;


if(!authHeader){

return res.status(401).json({

success:false,

message:"توکن ارسال نشده"

});

}



const token =
authHeader.split(" ")[1];


const decoded =
jwt.verify(
token,
process.env.JWT_SECRET
);




const data = req.body;




const result =
new AnalysisResult({


userId:
decoded.userId,


examId:
data.examId,


title:
data.title || "",


subject:
data.subject || "",



totalQuestions:
data.totalQuestions || 0,


answered:
data.answered || 0,


correct:
data.correct || 0,


wrong:
data.wrong || 0,


unanswered:
data.unanswered || 0,


percent:
data.percent || 0,



subjects:
data.subjects || [],



ai:
data.ai || {}



});




await result.save();





res.json({

success:true,

message:"تحلیل ذخیره شد",

result

});



}
catch(error){


console.log(
"CREATE ANALYSIS ERROR:",
error
);



res.status(500).json({

success:false,

message:error.message

});


}


});




module.exports = router;