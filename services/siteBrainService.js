const File =
require("../models/File");

const SiteMemory =
require("../models/SiteMemory");



async function updateSiteBrain(){


    const files =
    await File.find({})
    .lean();



    const lessons={};


    files.forEach(file=>{


        const lesson =
        file.lesson || "سایر";


        if(!lessons[lesson])
            lessons[lesson]=0;


        lessons[lesson]++;


    });



    await SiteMemory.deleteMany({});



    await SiteMemory.create([

        {
            type:"stats",
            key:"total_files",
            value:files.length
        },


        {
            type:"lessons",
            key:"file_count",
            value:lessons
        },


        {
            type:"latest",
            key:"files",
            value:
            files
            .slice(-20)
            .map(x=>({
                name:x.name,
                lesson:x.lesson
            }))
        }

    ]);



    console.log(
        "🧠 SITE BRAIN UPDATED"
    );


}




async function getSiteContext(){


    const data =
    await SiteMemory.find({})
    .lean();


    let context="";


    data.forEach(item=>{


        context += `

${item.key}:

${JSON.stringify(item.value)}

`;

    });



    return context;


}




module.exports={
    updateSiteBrain,
    getSiteContext
};