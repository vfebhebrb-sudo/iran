// ======================================================
// PDF TEXT PROCESSOR
// آماده سازی متن PDF برای AI
// ======================================================


function processText(
    text
){

    try{


        console.log(
            "⚙️ PROCESS PDF TEXT"
        );


        if(!text){

            return {

                success:false,

                text:"",

                chunks:[]

            };

        }



        // حذف فاصله های اضافی

        let cleanText =
            text
            .replace(/\s+/g," ")
            .trim();



        console.log(
            "📄 CLEAN TEXT LENGTH:",
            cleanText.length
        );



        // تقسیم متن برای پردازش بهتر

        const chunkSize = 1500;


        const chunks = [];



        for(
            let i = 0;
            i < cleanText.length;
            i += chunkSize
        ){


            chunks.push(

                cleanText.substring(
                    i,
                    i + chunkSize
                )

            );


        }



        console.log(
            "🧩 TEXT CHUNKS:",
            chunks.length
        );



        return {


            success:true,


            text:
            cleanText,


            chunks



        };


    }
    catch(error){


        console.error(
            "❌ PROCESS TEXT ERROR:",
            error.message
        );


        throw error;


    }

}





module.exports = {

    processText

};