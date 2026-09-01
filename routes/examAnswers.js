const express = require("express");

const router = express.Router();


const Test = require("../models/Test");
const ExamSubmission = require("../models/ExamSubmission");
const User = require("../models/User");



// ============================================
// GET FULL EXAM ANALYSIS
// ============================================


router.get(

"/analysis/:examId/:userId",

async(req,res)=>{


try{


const {
    examId,
    userId
}=req.params;



// ============================================
// GET EXAM
// ============================================


const exam = await Test.findById(examId);



if(!exam){

return res.json({

success:false,

message:"آزمون پیدا نشد"

});

}



// ============================================
// GET USER
// ============================================


const user = await User.findById(userId);



if(!user){

return res.json({

success:false,

message:"کاربر پیدا نشد"

});

}



// ============================================
// GET STUDENT SUBMISSION
// ============================================


const submission = 

await ExamSubmission.findOne({

examId,
userId

});




if(!submission){

return res.json({

success:false,

message:"پاسخ کاربر وجود ندارد"

});

}




// ============================================
// ANALYSIS
// ============================================


let answers=[];


let correct=0;

let wrong=0;

let empty=0;




exam.questions.forEach(

(question,index)=>{


const studentAnswer =

submission.answers[index];



let status="empty";




// بدون پاسخ

if(

studentAnswer === undefined ||

studentAnswer === null

){

empty++;

}



// درست

else if(

studentAnswer === question.correctAnswer

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

question.question,


options:

question.options,



studentAnswer:

studentAnswer ?? null,



correctAnswer:

question.correctAnswer,



status


});



});






// ============================================
// PERCENT
// ============================================


const total = exam.questions.length;



const percent = total > 0

?

Math.round(

(correct / total) * 100

)

:

0;






// ============================================
// RESPONSE
// ============================================



res.json({

success:true,



// USER INFO

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




// EXAM INFO

exam:{


id:exam._id,


title:

exam.title,


subject:

exam.subject,


duration:

exam.duration,


totalQuestions:

total


},





// RESULT SUMMARY


summary:{


correct,


wrong,


empty,


percent


},





// ANSWER SHEET


answers



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




module.exports = router;