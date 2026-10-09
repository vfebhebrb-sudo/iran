
"use strict";

const API_BASE_URL =
    "https://iran-production-d9c4.up.railway.app";

const tools = [
    {
        functionDeclarations: [
            {
                name: "list_files",
                description:
                    "فهرست PDFهای ثبت‌شده در سیستم فایل روبیکا و تلگرام را دریافت کن. برای یافتن فایل موردنظر کاربر از این ابزار استفاده کن.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        source: {
                            type: "STRING",
                            enum: ["rubika", "telegram", "all"],
                            description:
                                "منبع فایل؛ در صورت نامشخص بودن all"
                        }
                    }
                }
            },
            {
                name: "open_pdf",
                description:
                    "یک PDF را با شناسه و منبع آن باز کن تا برای سؤال‌وجواب آماده شود.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        fileId: {
                            type: "STRING",
                            description: "شناسه رکورد فایل در سیستم"
                        },
                        source: {
                            type: "STRING",
                            enum: ["rubika", "telegram"],
                            description: "منبع فایل"
                        }
                    },
                    required: ["fileId", "source"]
                }
            },
            {
                name: "ask_pdf",
                description:
                    "از محتوای PDF فعالی که قبلاً باز شده سؤال بپرس.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        question: {
                            type: "STRING",
                            description: "سؤال کاربر درباره PDF"
                        }
                    },
                    required: ["question"]
                }
            }
        ]
    }
];

async function fetchJSON(url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message || "دریافت اطلاعات فایل ناموفق بود."
        );
    }

    return data;
}

async function listFiles(source = "all") {
    const sources =
        source === "all"
            ? [
                { name: "rubika", endpoint: "/api/files" },
                { name: "telegram", endpoint: "/api/telegram-files" }
            ]
            : [
                {
                    name: source,
                    endpoint:
                        source === "telegram"
                            ? "/api/telegram-files"
                            : "/api/files"
                }
            ];

    const results = await Promise.all(
        sources.map(async item => {
            const data = await fetchJSON(
                `${API_BASE_URL}${item.endpoint}`
            );

            return data.files.map(file => ({
                id: String(file.id),
                name: file.name,
                lesson: file.lesson,
                source: item.name,
                fileType: file.fileType,
                size: file.size
            }));
        })
    );

    return {
        success: true,
        files: results.flat()
    };
}

async function openPdf(fileId, source) {
    if (
        typeof fileId !== "string" ||
        !/^[a-f0-9]{24}$/i.test(fileId) ||
        !["rubika", "telegram"].includes(source)
    ) {
        return {
            success: false,
            error: "شناسه یا منبع فایل معتبر نیست."
        };
    }

    const endpoint =
        source === "telegram"
            ? "/api/telegram-files"
            : "/api/files";

    const data = await fetchJSON(
        `${API_BASE_URL}${endpoint}/${encodeURIComponent(fileId)}/open`
    );

    return {
        success: true,
        fileId,
        source,
        file: data.file,
        fileUrl: data.url,
        message:
            "فایل پیدا شد. اکنون باید PDF را در نشست سؤال‌وجواب بارگذاری کرد."
    };
}

async function askPdf(question, sessionId) {
    if (
        typeof question !== "string" ||
        !question.trim()
    ) {
        return {
            success: false,
            error: "سؤال معتبری ارسال نشده است."
        };
    }

    if (
        typeof sessionId !== "string" ||
        !sessionId.trim()
    ) {
        return {
            success: false,
            error: "ابتدا باید یک PDF باز و بارگذاری شود."
        };
    }

    const response = await fetch(
        `${API_BASE_URL}/api/ai/pdf/chat`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sessionId,
                message: question.trim()
            })
        }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
        return {
            success: false,
            error:
                data.message ||
                data.error ||
                "پاسخ‌گویی به سؤال PDF ناموفق بود."
        };
    }

    return {
        success: true,
        reply: data.reply
    };
}

async function executeTool(name, args = {}, context = {}) {
    try {
        switch (name) {
            case "list_files":
                return await listFiles(args.source || "all");

            case "open_pdf":
                return await openPdf(
                    args.fileId,
                    args.source
                );

            case "ask_pdf":
                return await askPdf(
                    args.question,
                    context.sessionId || args.sessionId
                );

            default:
                return {
                    success: false,
                    error: `ابزار ناشناخته است: ${name}`
                };
        }
    } catch (error) {
        console.error(
            `AI TOOL ERROR [${name}]:`,
            error.message
        );

        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    API_BASE_URL,
    tools,
    executeTool,
    listFiles,
    openPdf,
    askPdf
};