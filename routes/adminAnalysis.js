const express = require("express");

const router = express.Router();


const Test = require("../models/Test");
const User = require("../models/User");
const ExamSubmission = require("../models/ExamSubmission");




// ==========================================
// FULL EXAM ANALYSIS
// ==========================================


router.get(

"/:examId/:userId",

async(req,res)=>{


try{


const {

examId,

userId

}=req.params;



console.log(
"ANALYSIS REQUEST:",
{
examId,
userId
}
);




// ==========================================
// FIND EXAM
// ==========================================


const exam = await Test.findById(examId);



if(!exam){


return res.json({

success:false,

message:"آزمون پیدا نشد"

});


}




// ==========================================
// FIND USER
// ==========================================


const user = await User.findById(userId);



if(!user){


return res.json({

success:false,

message:"کاربر پیدا نشد"

});


}





// ==========================================
// FIND SUBMISSION
// ==========================================


const submission = await ExamSubmission.findOne({

examId:examId.toString(),

userId:userId.toString()

});




if(!submission){


return res.json({

success:false,

message:"پاسخنامه کاربر پیدا نشد"

});


}




console.log(
"FOUND SUBMISSION:",
submission._id
);





// ==========================================
// ANALYZE ANSWERS
// ==========================================


let answers=[];


let correct=0;

let wrong=0;

let empty=0;



const studentAnswers =

Array.isArray(submission.answers)

?

submission.answers

:

[];





exam.questions.forEach(

(question,index)=>{


let studentAnswer =

studentAnswers[index];



if(
studentAnswer !== undefined &&
studentAnswer !== null
){

studentAnswer =
Number(studentAnswer);

}



let status="empty";




// بدون پاسخ

if(

studentAnswer === undefined ||

studentAnswer === null ||

Number.isNaN(studentAnswer)

){


empty++;


}




// درست

else if(

Number(studentAnswer)

===

Number(question.correctAnswer)

){


correct++;

status="correct";


}




// غلط

else{


wrong++;

status="wrong";


}






answers.push({

number:index+1,


question:

question.question || "",


options:

question.options || [],



studentAnswer:


studentAnswer ?? null,



correctAnswer:

Number(question.correctAnswer),



status


});





});







// ==========================================
// RESULT
// ==========================================


const totalQuestions =

exam.questions.length;




const percent =

totalQuestions > 0

?

Math.round(

(correct / totalQuestions) * 100

)

:

0;







// ==========================================
// RESPONSE
// ==========================================


res.json({

success:true,



user:{


id:user._id,


fullname:
user.fullname || "---",


phone:
user.phone || "---",


email:
user.email || "---",


candidateNumber:
user.candidateNumber || "---"


},





exam:{


id:exam._id,


title:
exam.title || "---",


subject:
exam.subject || "---",


duration:
exam.duration || 0,


totalQuestions


},





summary:{


correct,


wrong,


empty,


answered:

correct + wrong,


percent


},




answers



});





}

catch(error){


console.log(

"ADMIN ANALYSIS ERROR:",
error

);



res.status(500).json({

success:false,

message:error.message

});


}



});





module.exports = router;