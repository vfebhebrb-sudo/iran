const express = require("express");

const router = express.Router();

const jwt = require("jsonwebtoken");

const ExamResult = require("../models/ExamResult");
const ExamSubmission = require("../models/ExamSubmission");
const Test = require("../models/Test");



// ======================================================
// AUTH
// ======================================================


function getUserFromToken(req){


    const authHeader =
    req.headers.authorization;



    if(!authHeader){

        throw new Error(
            "توکن ارسال نشده"
        );

    }



    const token =
    authHeader.split(" ")[1];



    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );


}




// ======================================================
// CREATE RESULT
// ======================================================


router.post(
"/create",
async(req,res)=>{


try{


const decoded =
getUserFromToken(req);



const {

examId,

answers,

markedQuestions=[]

}=req.body;



const exam =
await Test.findById(examId);



if(!exam){

return res.status(404).json({

success:false,

message:"آزمون پیدا نشد"

});

}




let correctAnswers=0;

let wrongAnswers=0;



exam.questions.forEach(
(q,index)=>{


const userAnswer =
answers[index+1];



if(userAnswer === undefined)
return;



if(
Number(userAnswer)
===
Number(q.correctAnswer)
){

correctAnswers++;

}
else{

wrongAnswers++;

}



});





const totalQuestions =
exam.questions.length;



const answeredQuestions =
correctAnswers + wrongAnswers;



const unanswered =
totalQuestions - answeredQuestions;



const score =
totalQuestions
?
Math.round(
(correctAnswers / totalQuestions) * 100
)
:
0;





const result =
new ExamResult({


userId:
decoded.userId,


examId,


title:
exam.title,


subject:
exam.subject,


answers,


markedQuestions,


totalQuestions,


answeredQuestions,


correctAnswers,


wrongAnswers,


unanswered,


score,


duration:
exam.duration || 0



});





await result.save();





res.json({

success:true,

message:"نتیجه ذخیره شد",

result

});



}
catch(error){


console.log(
"CREATE RESULT ERROR:",
error
);


res.status(500).json({

success:false,

message:error.message

});


}


});








// ======================================================
// HISTORY
// ======================================================


router.get(
"/history",
async(req,res)=>{


try{


const decoded =
getUserFromToken(req);



const results =
await ExamResult.find({

userId:
decoded.userId

})
.sort({

createdAt:-1

})
.limit(20);




res.json({

success:true,

results

});



}
catch(error){


res.status(500).json({

success:false,

message:error.message

});


}



});









// ======================================================
// SINGLE RESULT
// ======================================================


router.get(
"/result/:examId",
async(req,res)=>{


try{


const decoded =
getUserFromToken(req);



const result =
await ExamResult.findOne({

userId:
decoded.userId,


examId:
req.params.examId

});



if(!result){

return res.json({

success:false,

message:"نتیجه پیدا نشد"

});

}



res.json({

success:true,

result

});



}
catch(error){


res.status(500).json({

success:false,

message:error.message

});


}



});









// ======================================================
// USER EXAM ANALYSIS
// ======================================================
router.get(
"/user-exam/:userId/:examId",
async(req,res)=>{


try{


const {
userId,
examId
}=req.params;



console.log(
"ANALYSIS REQUEST:",
userId,
examId
);



// گرفتن نتیجه ذخیره شده
const result = await ExamResult.findOne({

userId,
examId

});



if(!result){

return res.json({

success:false,

message:"نتیجه آزمون پیدا نشد"

});

}



// گرفتن اطلاعات آزمون

const exam = await Test.findById(examId);



if(!exam){

return res.json({

success:false,

message:"آزمون پیدا نشد"

});

}




res.json({

success:true,


exam:{


id:exam._id,

title:exam.title,

duration:exam.duration,

totalQuestions:
result.totalQuestions


},



result:{


answered:
result.answeredQuestions || 0,


correct:
result.correctAnswers || 0,


wrong:
result.wrongAnswers || 0,


empty:
result.unanswered || 0,


percent:
result.score || 0



}


});





}
catch(error){


console.log(
"USER EXAM ANALYSIS ERROR:",
error
);


res.status(500).json({

success:false,

message:error.message

});


}


});



module.exports = router;