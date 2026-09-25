const {
    askGeminiPdf
} = require("../ai/gemini");


// =======================================
// ANALYZE ANSWER PDF
// =======================================

async function analyzeAnswerPdf(pdfBuffer){

    const prompt = `

این فایل PDF یک پاسخنامه آزمون آموزشی است.

وظیفه تو فقط تحلیل پاسخنامه است.

هیچ سوالی تولید نکن.
هیچ متن سوالی تولید نکن.
هیچ گزینه‌ای تولید نکن.

فقط این دو مورد را از PDF استخراج کن:

1. تعداد کل سوالات
2. گزینه صحیح هر سوال

گزینه صحیح هر سوال باید فقط یکی از این اعداد باشد:

1
2
3
4


قوانین بسیار مهم:

- شماره سوال‌ها را دقیقاً از روی PDF بخوان.
- سوال‌ها باید به ترتیب شماره باشند.
- از شماره 1 شروع کن.
- برای هر سوال فقط گزینه صحیح را مشخص کن.
- اگر پاسخ سوال 1 گزینه 3 است، مقدار correctAnswer باید 3 باشد.
- اگر پاسخ سوال 2 گزینه 1 است، مقدار correctAnswer باید 1 باشد.
- هیچ سوالی را حذف نکن.
- هیچ سوالی را اضافه نکن.
- چیزی را حدس نزن.
- اگر PDF پاسخنامه ناقص یا ناخوانا است، تا حد امکان فقط اطلاعاتی را برگردان که واقعاً از فایل قابل تشخیص است.
- خروجی باید فقط JSON معتبر باشد.
- از Markdown استفاده نکن.
- قبل یا بعد از JSON هیچ توضیحی ننویس.


ساختار خروجی دقیقاً باید این باشد:

{
    "questionCount": 0,
    "answerKey": [
        {
            "questionNumber": 1,
            "correctAnswer": 2
        }
    ]
}

`;


    const response =
        await askGeminiPdf(
            pdfBuffer,
            prompt
        );


    if(
        !response ||
        response.includes(
            "الان هوش مصنوعی در دسترس نیست"
        )
    ){

        throw new Error(
            "Gemini در دسترس نیست"
        );

    }


    // ===================================
    // CLEAN RESPONSE
    // ===================================

    let cleanResponse =
        response
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();


    // ===================================
    // PARSE JSON
    // ===================================

    let result;

    try{

        result =
            JSON.parse(
                cleanResponse
            );

    }

    catch(error){

        console.log(
            "GEMINI PDF INVALID JSON:"
        );

        console.log(
            cleanResponse
        );

        throw new Error(
            "خروجی Gemini برای پاسخنامه معتبر نیست"
        );

    }


    // ===================================
    // VALIDATE QUESTION COUNT
    // ===================================

    if(
        !Number.isInteger(
            Number(result.questionCount)
        ) ||
        Number(result.questionCount) < 1
    ){

        throw new Error(
            "تعداد سوالات استخراج شده نامعتبر است"
        );

    }


    const questionCount =
        Number(
            result.questionCount
        );


    // ===================================
    // VALIDATE ANSWER KEY
    // ===================================

    if(
        !Array.isArray(
            result.answerKey
        )
    ){

        throw new Error(
            "پاسخنامه استخراج شده نامعتبر است"
        );

    }


    if(
        result.answerKey.length !==
        questionCount
    ){

        throw new Error(
            `تعداد پاسخ‌ها با تعداد سوالات برابر نیست. تعداد سوالات: ${questionCount} - تعداد پاسخ‌ها: ${result.answerKey.length}`
        );

    }


    // ===================================
    // NORMALIZE + VALIDATE
    // ===================================

    const answerKey =
        result.answerKey.map(
        (item,index)=>{

            const questionNumber =
                Number(
                    item.questionNumber
                );

            const correctAnswer =
                Number(
                    item.correctAnswer
                );


            // شماره سوال
            if(
                questionNumber !==
                index + 1
            ){

                throw new Error(
                    `شماره سوال ${index+1} صحیح نیست`
                );

            }


            // پاسخ صحیح
            if(
                !Number.isInteger(
                    correctAnswer
                ) ||
                correctAnswer < 1 ||
                correctAnswer > 4
            ){

                throw new Error(
                    `پاسخ سوال ${questionNumber} باید بین 1 تا 4 باشد`
                );

            }


            return {

                questionNumber,

                correctAnswer

            };

        });


    // ===================================
    // FINAL RESULT
    // ===================================

    return {

        questionCount,

        answerKey

    };

}


module.exports =
    analyzeAnswerPdf;