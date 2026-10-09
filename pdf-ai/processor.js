"use strict";


// ======================================================
// PDF TEXT PROCESSOR
// آماده سازی متن PDF برای AI
// ======================================================



// ======================================================
// PROCESS PDF TEXT
// ======================================================

function processText(text){


    try{


        console.log(
            "⚙️ PDF TEXT PROCESS START"
        );



        if(
            !text ||
            typeof text !== "string"
        ){


            return {


                success:false,


                text:"",


                chunks:[]


            };


        }





        // ==================================================
        // CLEAN TEXT
        // ==================================================


        let cleanText =
            text

            // حذف فاصله‌های زیاد

            .replace(
                /\s+/g,
                " "
            )

            // حذف فاصله اول و آخر

            .trim();




        console.log(
            "📝 CLEAN TEXT:",
            cleanText.length
        );





        if(!cleanText){


            return {


                success:false,


                text:"",


                chunks:[]


            };


        }






        // ==================================================
        // CHUNK SYSTEM
        // ==================================================


        const MAX_CHUNK_SIZE =
            2000;



        const chunks = [];



        let currentIndex =
            0;



        while(
            currentIndex < cleanText.length
        ){



            let end =
                currentIndex +
                MAX_CHUNK_SIZE;




            // اگر وسط جمله بود،
            // دنبال فاصله بگرد


            if(
                end < cleanText.length
            ){


                const lastSpace =
                    cleanText.lastIndexOf(
                        " ",
                        end
                    );



                if(
                    lastSpace >
                    currentIndex
                ){


                    end =
                        lastSpace;


                }


            }





            const chunk =
                cleanText.substring(
                    currentIndex,
                    end
                );



            chunks.push(
                chunk.trim()
            );



            currentIndex =
                end;



        }





        console.log(
            "🧩 TOTAL CHUNKS:",
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
            "❌ PDF PROCESS ERROR:",
            error.message
        );



        return {


            success:false,


            text:"",


            chunks:[],


            error:
                error.message


        };


    }


}






module.exports = {


    processText


};