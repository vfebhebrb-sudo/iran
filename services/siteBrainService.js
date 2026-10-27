const File = require("../models/File");
const SiteMemory = require("../models/SiteMemory");

// کش کوتاه تا هر پیام گروه به دیتابیس نخوره
const CACHE_MS = 60 * 1000;

let cache = { text: "", at: 0 };

async function updateSiteBrain() {

    // فقط فیلدهای لازم
    const files = await File.find({}, "name lesson").lean();

    const lessons = {};

    files.forEach(file => {

        const lesson = file.lesson || "سایر";

        if (!lessons[lesson]) lessons[lesson] = 0;

        lessons[lesson]++;

    });

    // ۲۰ فایل آخر (بر اساس زمان ساخت _id)
    const latest = await File.find({}, "name lesson")
        .sort({ _id: -1 })
        .limit(20)
        .lean();

    const records = [
        {
            type: "stats",
            key: "total_files",
            value: files.length
        },
        {
            type: "lessons",
            key: "file_count",
            value: lessons
        },
        {
            type: "latest",
            key: "files",
            value: latest
                .reverse()
                .map(x => ({
                    name: x.name,
                    lesson: x.lesson
                }))
        }
    ];

    // به‌جای deleteMany + create: هیچ‌وقت لحظه‌ی خالی نداریم
    await SiteMemory.bulkWrite(
        records.map(record => ({
            updateOne: {
                filter: { type: record.type, key: record.key },
                update: { $set: { value: record.value } },
                upsert: true
            }
        }))
    );

    cache = { text: "", at: 0 };

    console.log("🧠 SITE BRAIN UPDATED");

}

async function getSiteContext() {

    if (cache.text && Date.now() - cache.at < CACHE_MS) {

        return cache.text;

    }

    const data = await SiteMemory.find({}).lean();

    let context = "";

    data.forEach(item => {

        context += `

${item.key}:

${JSON.stringify(item.value)}

`;

    });

    cache = { text: context, at: Date.now() };

    return context;

}

module.exports = {
    updateSiteBrain,
    getSiteContext
};