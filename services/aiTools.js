"use strict";


const API_BASE_URL =
    "https://iran-production-d9c4.up.railway.app";




// ======================================================
// GEMINI TOOLS
// ======================================================


const tools = [

    {

        functionDeclarations:[


            {

                name:"list_files",

                description:
                "لیست فایل‌های PDF موجود در روبیکا و تلگرام را دریافت کن.",


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
                "یک فایل PDF را باز و آماده پردازش کن.",


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
                "یک PDF را دانلود می‌کند و با استفاده از موتور هوش مصنوعی آن را می‌خواند و به سؤال کاربر پاسخ می‌دهد.",


                parameters:{

                    type:"OBJECT",

                    properties:{


                        fileId:{

                            type:"STRING",

                            description:
                            "شناسه فایل PDF"

                        },


                        source:{

                            type:"STRING",

                            enum:[
                                "rubika",
                                "telegram"
                            ]

                        },


                        question:{

                            type:"STRING",

                            description:
                            "سؤال کاربر درباره فایل"

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
// FETCH JSON
// ======================================================


async function fetchJSON(url){


    const response =
        await fetch(url);



    const data =
        await response.json();



    if(!response.ok || !data.success){

        throw new Error(

            data.message ||
            "API ERROR"

        );

    }



    return data;


}









// ======================================================
// LIST FILES
// ======================================================


async function listFiles(source="all"){


    let urls=[];



    if(
        source==="all" ||
        source==="rubika"
    ){

        urls.push({

            source:"rubika",

            url:
            "/api/files"

        });

    }



    if(
        source==="all" ||
        source==="telegram"
    ){

        urls.push({

            source:"telegram",

            url:
            "/api/telegram-files"

        });

    }




    let files=[];



    for(
        const item of urls
    ){


        const data =
        await fetchJSON(

            API_BASE_URL +
            item.url

        );



        files.push(

            ...data.files.map(file=>({


                id:String(file.id),

                name:file.name,

                lesson:file.lesson,

                source:item.source,

                size:file.size,

                fileType:file.fileType


            }))

        );


    }




    return {


        success:true,

        files


    };


}









// ======================================================
// OPEN PDF
// ======================================================


async function openPdf(

    fileId,

    source

){


    const endpoint =

        source==="telegram"

        ?

        "/api/telegram-files"

        :

        "/api/files";




    const data =
    await fetchJSON(

        API_BASE_URL +

        endpoint +

        "/" +

        fileId +

        "/open"

    );




    return {


        success:true,

        fileId,

        source,

        url:data.url,

        file:data.file


    };


}









// ======================================================
// READ PDF WITH AI
// ======================================================


async function readPdf(args){



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

        "📚 AI READ PDF:",

        args.fileId

    );





    const response =

    await fetch(

        API_BASE_URL +

        "/api/ai/pdf/read",

        {


            method:"POST",


            headers:{


                "Content-Type":
                "application/json"


            },


            body:JSON.stringify({


                fileId:
                args.fileId,


                source:
                args.source,


                question:
                args.question



            })


        }

    );





    const data =
    await response.json();




    return data;


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

        "🛠 TOOL EXECUTE:",

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

                    args.fileId,

                    args.source

                );





            case "read_pdf":

                return await readPdf(

                    args

                );





            default:


                return {


                    success:false,

                    error:
                    "Tool not found"


                };



        }


    }

    catch(error){



        console.error(

            "AI TOOL ERROR:",

            error.message

        );



        return {


            success:false,

            error:error.message


        };


    }


}








module.exports={


    API_BASE_URL,


    tools,


    executeTool,


    listFiles,


    openPdf,


    readPdf


};