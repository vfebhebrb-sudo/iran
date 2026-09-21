require("dotenv").config();

const https = require("https");


const url =
`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;


https.get(url, (res)=>{

    let data = "";

    res.on("data", chunk=>{
        data += chunk;
    });


    res.on("end", ()=>{

        const json = JSON.parse(data);


        if(json.models){

            console.log("\n✅ Available models:\n");

            json.models.forEach(model=>{

                console.log(
                    model.name
                );

            });

        }else{

            console.log(json);

        }

    });


}).on("error",(err)=>{

    console.log(
        "ERROR:",
        err.message
    );

});