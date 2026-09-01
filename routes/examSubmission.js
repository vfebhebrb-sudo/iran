const express = require("express");

const router = express.Router();

const jwt = require("jsonwebtoken");

const ExamSubmission =
require("../models/ExamSubmission");





// ==========================================
// SUBMIT EXAM ANSWERS
// ==========================================


router.post(

"/submit",

async(req,res)=>{


try{


console.log(
"========== SUBMIT BODY =========="
);


console.log(
JSON.stringify(req.body,null,2)
);


console.log(
"================================"
);





// ==========================================
// CHECK TOKEN
// ==========================================


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



if(!token){

return res.status(401).json({

success:false,

message:"توکن نامعتبر"

});

}





const decoded =

jwt.verify(

token,

process.env.JWT_SECRET

);





// ==========================================
// DATA
// ==========================================


const data = req.body;



console.log(
"SUBMIT DATA:",
data
);





// ==========================================
// CONVERT ANSWERS OBJECT TO ARRAY
// ==========================================


let answers=[];



if(
data.answers &&
typeof data.answers === "object"
){


answers = Object.keys(data.answers)

.sort(
(a,b)=>Number(a)-Number(b)
)

.map(
(key)=>
Number(data.answers[key])
);


}





console.log(

"FINAL ANSWERS BEFORE SAVE:",

answers

);






// ==========================================
// CREATE SUBMISSION
// ==========================================


const submission =

new ExamSubmission({


userId:

decoded.userId,



examId:

data.examId,



answers:

answers,



markedQuestions:

Array.isArray(data.markedQuestions)

?

data.markedQuestions

:

[],



totalQuestions:

Number(data.totalQuestions) || 0,



answeredCount:

Number(data.answeredCount) || answers.length,



remainingCount:

Number(data.remainingCount) || 0,



});





await submission.save();





console.log(

"SUBMISSION SAVED:",

submission._id

);


console.log(

"SAVED ANSWERS:",

submission.answers

);






// ==========================================
// RESPONSE
// ==========================================


res.json({

success:true,

message:

"پاسخ آزمون ذخیره شد",


submission

});




}



catch(error){


console.log(

"SUBMIT ERROR:",

error

);



res.status(500).json({

success:false,

message:error.message

});


}


});






module.exports = router;