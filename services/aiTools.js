
"use strict";

const fs = require("fs");
const path = require("path");

// ======================================================
// CONFIG
// ======================================================

const API_BASE_URL =
    "https://iran-production-d9c4.up.railway.app";

const TEMP_DIR = path.join(
    __dirname,
    "..",
    "temp-files"
);

// ======================================================
// GEMINI TOOL DEFINITIONS
// ======================================================

const tools = [
    {
        functionDeclarations: [
            {
                name: "list_files",
                description:
                    "فهرست PDFهای موجود در پوشه temp-files را بگیر. برای پیدا کردن نام دقیق فایل، ابتدا از این ابزار استفاده کن.",
                parameters: {
                    type: "OBJECT",
                    properties: {}
                }
            },
            {
                name: "open_pdf",
                description:
                    "یک PDF را با نام دقیق از فهرست فایل‌ها انتخاب کن تا فرانت‌اند آن را بارگذاری کرده و برای سؤال‌وجواب آماده کند.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        filename: {
                            type: "STRING",
                            description:
                                "نام دقیق فایل PDF که از فهرست دریافت شده است."
                        }
                    },
                    required: ["filename"]
                }
            },
            {
                name: "ask_pdf",
                description:
                    "از محتوای PDF بارگذاری‌شده و فعال سؤال بپرس.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        question: {
                            type: "STRING",
                            description:
                                "سؤال کاربر درباره محتوای PDF."
                        }
                    },
                    required: ["question"]
                }
            }
        ]
    }
];

// ======================================================
// LIST PDF FILES
// ======================================================

async function listFiles() {
    const entries = await fs.promises.readdir(
        TEMP_DIR,
        { withFileTypes: true }
    );

    const files = entries
        .filter(entry =>
            entry.isFile() &&
            path.extname(entry.name).toLowerCase() === ".pdf"
        )
        .map(entry => entry.name);

    return {
        success: true,
        files
    };
}

// ======================================================
// FIND AND VALIDATE PDF
// ======================================================

async function openPdf(filename) {
    if (
        typeof filename !== "string" ||
        !filename.trim() ||
        path.basename(filename) !== filename ||
        path.extname(filename).toLowerCase() !== ".pdf"
    ) {
        return {
            success: false,
            error: "نام فایل PDF معتبر نیست."
        };
    }

    const filePath = path.join(
        TEMP_DIR,
        filename
    );

    try {
        const stat = await fs.promises.stat(filePath);

        if (!stat.isFile()) {
            return {
                success: false,
                error: "فایل موردنظر یک فایل معمولی نیست."
            };
        }
    } catch (error) {
        if (error.code === "ENOENT") {
            return {
                success: false,
                error: "فایل موردنظر در پوشه temp-files پیدا نشد."
            };
        }

        throw error;
    }

    return {
        success: true,
        filename,
        fileUrl:
            `${API_BASE_URL}/temp-files/${encodeURIComponent(filename)}`,
        message:
            "فایل پیدا شد. فرانت‌اند باید آن را دریافت و از طریق سیستم PDF بارگذاری کند."
    };
}

// ======================================================
// ASK QUESTION ABOUT ACTIVE PDF
// ======================================================

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
            error:
                "هنوز فایل PDF فعالی بارگذاری نشده است. ابتدا یک فایل را باز کن."
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

// ======================================================
// EXECUTE TOOL
// ======================================================

async function executeTool(
    name,
    args = {},
    context = {}
) {
    try {
        switch (name) {
            case "list_files":
                return await listFiles();

            case "open_pdf":
                return await openPdf(args.filename);

            case "ask_pdf": {
                const sessionId =
                    context.sessionId ||
                    args.sessionId;

                return await askPdf(
                    args.question,
                    sessionId
                );
            }

            default:
                return {
                    success: false,
                    error: `ابزار ناشناخته است: ${name}`
                };
        }
    } catch (error) {
        console.error(
            `AI TOOL ERROR [${name}]:`,
            error
        );

        return {
            success: false,
            error:
                name === "list_files"
                    ? "دریافت فهرست فایل‌ها ناموفق بود."
                    : "اجرای ابزار با خطا مواجه شد."
        };
    }
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    API_BASE_URL,
    TEMP_DIR,
    tools,
    executeTool,
    listFiles,
    openPdf,
    askPdf
};