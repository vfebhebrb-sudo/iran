"use strict";


// ======================================================
// AI TOOLS BRIDGE
// Gemini Live -> External PDF AI
// ======================================================


const API_BASE_URL =
    "https://iran-production-d9c4.up.railway.app";




// ======================================================
// GEMINI TOOL DEFINITIONS
// ======================================================


const tools = [

{
functionDeclarations:[


{

name:"list_files",

description:
"لیست فایل‌های PDF موجود در سیستم را دریافت کن.",


parameters:{

type:"OBJECT",

properties:{

source:{

type:"STRING",

enum:[
"rubika",
"telegram",
"all"
]

}

}

}

},




{

name:"open_pdf",

description:
"یک فایل PDF را برای کاربر باز کن.",


parameters:{

type:"OBJECT",

properties:{


fileId:{

type:"STRING"

},


source:{

type:"STRING",

enum:[
"rubika",
"telegram"
]

}


},


required:[
"fileId",
"source"
]


}

},






{

name:"read_pdf",

description:
"یک فایل PDF را با Gemini File API بخوان و به سوال کاربر پاسخ بده.",


parameters:{

type:"OBJECT",

properties:{


fileId:{

type:"STRING"

},


source:{

type:"STRING",

enum:[
"rubika",
"telegram"
]

},


question:{

type:"STRING"

}


},


required:[

"fileId",

"source",

"question"

]


}


}



]

}

];









// ======================================================
// FETCH HELPER
// ======================================================


async function apiRequest(

url,

options={}

){


const response =

await fetch(

API_BASE_URL + url,

options

);



const data =

await response.json();



if(

!response.ok

){


throw new Error(

data.error ||

"API ERROR"

);


}



return data;


}









// ======================================================
// LIST FILES
// ======================================================


async function listFiles(

source="all"

){



let result=[];




if(

source==="all" ||

source==="rubika"

){


const rubika =

await apiRequest(

"/api/files"

);



result.push(

...(rubika.files || []).map(file=>({

id:String(file.id),

name:file.name,

source:"rubika"

}))

);


}





if(

source==="all" ||

source==="telegram"

){


const telegram =

await apiRequest(

"/api/telegram-files"

);



result.push(

...(telegram.files || []).map(file=>({

id:String(file.id),

name:file.name,

source:"telegram"

}))

);


}





return {

success:true,

files:result

};


}









// ======================================================
// OPEN PDF
// ======================================================


async function openPdf(

args

){



const endpoint =

args.source==="telegram"

?

"/api/telegram-files/"

:

"/api/files/";





const data =

await apiRequest(

endpoint +

args.fileId +

"/open"

);




return {


success:true,


fileId:args.fileId,


source:args.source,


url:data.url || data.file


};


}









// ======================================================
// READ PDF
// Gemini File API
// ======================================================


async function readPdf(

args

){



if(

!args.fileId ||

!args.question

){


return {

success:false,

error:
"fileId و question لازم است"

};


}






console.log(

"📚 GEMINI FILE READ:",

args.fileId

);







const response =

await apiRequest(

"/api/pdf-ai/read",

{


method:"POST",


headers:{


"Content-Type":

"application/json"


},


body:

JSON.stringify({

fileId:

args.fileId,


source:

args.source,


question:

args.question

})


}

);






return response;


}









// ======================================================
// TOOL EXECUTOR
// ======================================================


async function executeTool(

name,

args={},

context={}

){



console.log(

"🛠 TOOL:",

name,

args

);




try{



switch(name){



case "list_files":


return await listFiles(

args.source || "all"

);





case "open_pdf":


return await openPdf(

args

);





case "read_pdf":


return await readPdf(

args

);





default:


return {

success:false,

error:
"Unknown tool"

};



}



}

catch(error){



console.error(

"❌ TOOL ERROR:",

error.message

);



return {

success:false,

error:error.message

};



}


}








module.exports={


tools,


executeTool,


listFiles,


openPdf,


readPdf


};