const express = require("express");

const router = express.Router();

const jwt = require("jsonwebtoken");

const ExamResult = require("../models/ExamResult");





// ======================================================
// گرفتن تاریخچه آزمون های اخیر کاربر
// ======================================================


router.get(
"/history",
async(req,res)=>{


try{


// ==================================================
// دریافت توکن
// ==================================================

const authHeader =
req.headers.authorization;


if(!authHeader){


return res.status(401).json({

message:"توکن ارسال نشده است"

});


}



const token =
authHeader.split(" ")[1];



if(!token){


return res.status(401).json({

message:"توکن نامعتبر است"

});


}




// ==================================================
// بررسی JWT
// ==================================================


const decoded =

jwt.verify(

token,

process.env.JWT_SECRET

);






// ==================================================
// دریافت 5 آزمون آخر
// ==================================================


const results =

await ExamResult.find({

userId:decoded.userId

})

.sort({

createdAt:-1

})

.limit(5)

.select(

"-__v"

);






// ==================================================
// پاسخ
// ==================================================


res.json({

success:true,

results

});





}



catch(error){


console.log(

"HISTORY ERROR:",

error

);



res.status(500).json({

success:false,

message:"خطا در دریافت تاریخچه آزمون"

});


}


});








// ======================================================
// دریافت آخرین آزمون برای صفحه تحلیل
// ======================================================


router.get(

"/latest",

async(req,res)=>{


try{


const authHeader =
req.headers.authorization;


if(!authHeader){

return res.status(401).json({

success:false,

message:"توکن ارسال نشده است"

});

}



const token =
authHeader.split(" ")[1];


if(!token){

return res.status(401).json({

success:false,

message:"توکن نامعتبر است"

});

}



const decoded =
jwt.verify(
token,
process.env.JWT_SECRET
);


const result =

await ExamResult.findOne({

userId:decoded.userId

})

.sort({

createdAt:-1

});




if(!result){


return res.status(404).json({

message:"آزمونی پیدا نشد"

});


}



res.json({

success:true,

result

});





}

catch(error){

console.log(
"LATEST RESULT ERROR:",
error
);


res.status(500).json({

success:false,

message:"خطا در دریافت آخرین آزمون",

error:error.message

});

}
});





module.exports = router;