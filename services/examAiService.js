const askGemini = require("../ai/gemini");

async function generateExam({
    title,
    subject,
    questionCount,
    answerKey
}) {

    const prompt = `
تو یک سازنده آزمون آموزشی هستی.

برای آزمون زیر ${questionCount} سؤال تولید کن.

عنوان آزمون:
${title}

درس:
${subject}

پاسخنامه:
${JSON.stringify(answerKey)}

قوانین بسیار مهم:

1. دقیقاً ${questionCount} سؤال تولید کن.
2. هر سؤال دقیقاً 4 گزینه داشته باشد.
3. متن سؤال خالی نباشد.
4. هیچ گزینه‌ای خالی نباشد.
5. پاسخ صحیح هر سؤال باید دقیقاً مطابق پاسخنامه داده‌شده باشد.
6. شماره سؤال‌ها از 1 شروع شود.
7. correctAnswer باید عدد 1 تا 4 باشد.
8. سؤال‌ها مرتبط با درس آزمون باشند.
9. خروجی فقط JSON باشد.
10. هیچ توضیحی قبل یا بعد از JSON ننویس.
11. از Markdown استفاده نکن.

ساختار خروجی دقیقاً باید این باشد:

{
  "questions": [
    {
      "questionNumber": 1,
      "question": "متن سؤال",
      "options": [
        "گزینه 1",
        "گزینه 2",
        "گزینه 3",
        "گزینه 4"
      ],
      "correctAnswer": 2
    }
  ]
}
`;

    const response = await askGemini(prompt);

    if (
        !response ||
        response.includes("الان هوش مصنوعی در دسترس نیست")
    ) {
        throw new Error("Gemini در دسترس نیست");
    }

    let cleanResponse = response
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    let result;

    try {
        result = JSON.parse(cleanResponse);
    } catch (error) {
        console.log("GEMINI INVALID JSON:");
        console.log(cleanResponse);

        throw new Error("خروجی Gemini معتبر نیست");
    }

    if (
        !result.questions ||
        !Array.isArray(result.questions)
    ) {
        throw new Error("ساختار سؤال‌ها نامعتبر است");
    }

    if (result.questions.length !== Number(questionCount)) {
        throw new Error(
            `تعداد سؤال تولید شده صحیح نیست. مورد انتظار: ${questionCount}، تولید شده: ${result.questions.length}`
        );
    }

    result.questions.forEach((item, index) => {

        if (!item.question || !item.question.trim()) {
            throw new Error(
                `متن سؤال ${index + 1} خالی است`
            );
        }

        if (
            !Array.isArray(item.options) ||
            item.options.length !== 4
        ) {
            throw new Error(
                `سؤال ${index + 1} باید دقیقاً 4 گزینه داشته باشد`
            );
        }

        item.options.forEach((option, optionIndex) => {

            if (
                typeof option !== "string" ||
                !option.trim()
            ) {
                throw new Error(
                    `گزینه ${optionIndex + 1} سؤال ${index + 1} خالی است`
                );
            }

        });

        if (
            !Number.isInteger(item.correctAnswer) ||
            item.correctAnswer < 1 ||
            item.correctAnswer > 4
        ) {
            throw new Error(
                `پاسخ صحیح سؤال ${index + 1} نامعتبر است`
            );
        }

        const expectedAnswer =
            Number(answerKey[index]);

        if (
            expectedAnswer &&
            item.correctAnswer !== expectedAnswer
        ) {
            throw new Error(
                `پاسخ سؤال ${index + 1} با پاسخنامه مطابقت ندارد`
            );
        }

    });

    return result;
}

module.exports = generateExam;