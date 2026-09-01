const express = require("express");

const router = express.Router();


const ExamSubmission = require("../models/ExamSubmission");
const Test = require("../models/Test");




// ======================================
// دریافت آزمون های شرکت کرده یک کاربر
// ======================================


router.get(

"/user-exams/:userId",

async(req,res)=>{


try{


const userId = req.params.userId;



console.log(
"GET USER EXAMS:",
userId
);





const submissions =

await ExamSubmission.find({

userId

})

.sort({

createdAt:-1

});





const exams=[];





for(const submission of submissions){



const exam =

await Test.findById(

submission.examId

);




if(!exam)
continue;





// محاسبه تعداد پاسخ درست و درصد

let correct = 0;



exam.questions.forEach(

(question,index)=>{


const answer =

submission.answers[index];



if(

answer !== undefined &&

answer !== null &&

Number(answer) === Number(question.correctAnswer)

){

correct++;

}


}

);





const totalQuestions =

exam.questions.length;



const answered =

submission.answeredCount || 0;




const percent = totalQuestions

?

Math.round(

(correct / totalQuestions) * 100

)

:

0;







exams.push({



examId:

exam._id,



title:

exam.title || "---",



subject:

exam.subject || "-",



duration:

exam.duration || 0,



questionCount:

totalQuestions,



answeredCount:

answered,



correct,



percent,



createdAt:

submission.createdAt



});





}





res.json({


success:true,


count:exams.length,


exams



});




}

catch(error){


console.log(

"USER EXAMS ERROR:",

error

);



res.status(500).json({


success:false,


message:error.message


});



}


});





module.exports = router;