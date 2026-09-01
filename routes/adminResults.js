const express = require("express");

const router = express.Router();


const ExamSubmission = require("../models/ExamSubmission");
const User = require("../models/User");
const Test = require("../models/Test");



// ======================================
// GET ALL EXAMS WITH SUBMISSIONS
// ======================================

router.get(
"/exams",
async(req,res)=>{


try{


const submissions = await ExamSubmission.find()
.select("examId")
.lean();



const examMap = {};



submissions.forEach(item=>{


const id = item.examId.toString();


if(!examMap[id]){

examMap[id]=0;

}


examMap[id]++;


});



const result=[];



for(const examId in examMap){



const exam = await Test.findById(examId);



if(exam){


result.push({

examId:exam._id,


title:
exam.title || "بدون عنوان",


subject:
exam.subject || "-",


duration:
exam.duration || 0,


questionCount:
exam.questions?.length || 0,


participants:
examMap[examId]


});


}



}




res.json({

success:true,

exams:result

});



}

catch(error){


console.log(
"ADMIN EXAMS ERROR:",
error
);


res.status(500).json({

success:false,

message:error.message

});


}


});








// ======================================
// GET USERS OF EXAM
// ======================================


router.get(

"/users/:examId",

async(req,res)=>{


try{


const submissions = await ExamSubmission.find({

examId:req.params.examId

})
.sort({

createdAt:-1

});



const users=[];



for(const submission of submissions){



const user = await User.findById(

submission.userId

)
.select(

"fullname phone email candidateNumber"

);



if(user){


users.push({

userId:user._id,


fullname:
user.fullname || "بدون نام",


phone:
user.phone || "-",


email:
user.email || "-",


candidateNumber:
user.candidateNumber || "---",



answeredCount:
submission.answeredCount || 0,


totalQuestions:
submission.totalQuestions || 0,


submissionId:
submission._id


});


}


}




res.json({

success:true,

users

});



}


catch(error){


console.log(
"ADMIN USERS ERROR:",
error
);


res.status(500).json({

success:false,

message:error.message

});


}



});









// ======================================
// GET USER ANSWER SHEET
// ======================================


router.get(

"/:examId/:userId",

async(req,res)=>{


try{


const submission = await ExamSubmission.findOne({

examId:req.params.examId,

userId:req.params.userId

});




if(!submission){


return res.json({

success:false,

message:"پاسخنامه پیدا نشد"

});


}





res.json({

success:true,

result:submission

});




}


catch(error){


console.log(

"ADMIN ANSWER ERROR:",

error

);



res.status(500).json({

success:false,

message:error.message

});


}


});




module.exports = router;