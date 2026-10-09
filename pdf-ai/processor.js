// ======================================================
// PDF PROCESSOR
// آماده سازی متن PDF برای AI
// ======================================================



// ======================================================
// CLEAN TEXT
// ======================================================


function cleanText(text=""){


    try{


        let cleaned = text;



        // حذف فاصله های اضافی

        cleaned =
            cleaned.replace(
                /[ \t]+/g,
                " "
            );



        // حذف خط خالی زیاد

        cleaned =
            cleaned.replace(
                /\n\s*\n\s*\n+/g,
                "\n\n"
            );



        // حذف فاصله اول و آخر

        cleaned =
            cleaned.trim();



        console.log(
            "🧹 CLEAN TEXT LENGTH:",
            cleaned.length
        );



        return cleaned;



    }
    catch(error){


        console.error(
            "❌ CLEAN TEXT ERROR:",
            error.message
        );


        return text;


    }


}






// ======================================================
// SPLIT TEXT
// تقسیم متن برای Gemini
// ======================================================


function splitText(

    text,

    size=4000

){


    const chunks = [];



    let start = 0;



    while(
        start < text.length
    ){


        chunks.push(

            text.substring(
                start,
                start + size
            )

        );


        start += size;


    }



    console.log(

        "📦 TEXT CHUNKS:",

        chunks.length

    );



    return chunks;


}






// ======================================================
// PROCESS PDF TEXT
// ======================================================


function processText(text){



    const cleaned =
        cleanText(text);



    const chunks =
        splitText(cleaned);



    return {


        text: cleaned,


        chunks


    };


}





module.exports = {


    cleanText,


    splitText,


    processText


};