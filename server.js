// ======================================================
// KONKUR APP — MAIN SERVER
// ======================================================

require("dotenv").config();


// ======================================================
// DNS
// ======================================================

const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);


// ======================================================
// IMPORTS
// ======================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");


// ======================================================
// ROUTES
// ======================================================

// Authentication
const authRoutes = require("./routes/auth");
const passwordResetRoutes = require("./routes/passwordReset");

// Admin
const adminRoutes = require("./routes/admin");
const adminTestRoutes = require("./routes/adminTests");
const adminResultsRoutes = require("./routes/adminResults");
const adminAnalysisRoutes = require("./routes/adminAnalysis");
const aiAdminRoute = require("./routes/aiAdmin");

// Plans
const planRoutes = require("./routes/plans");
const plannerAIRoutes = require("./routes/plannerAI.routes");

// AI
const aiRoutes = require("./routes/ai-test");

// Chat
const chatRoutes = require("./routes/chat");

// Tests & Exams
const testRoutes = require("./routes/tests");
const examResultsRoute = require("./routes/examResults");
const examSubmissionRoute = require("./routes/examSubmission");
const examAnswersRoutes = require("./routes/examAnswers");

// Results & Analysis
const resultRoutes = require("./routes/results");
const userResultsRoutes = require("./routes/userResults");
const analysisRoutes = require("./routes/analysis");

// Smart Assistant
const smartAssistantRouter =
    require("./routes/smartAssistantRoute");

const smartAssistantContextRouter =
    require("./routes/smartAssistantContextRoute");

const smartAssistantSettingsRouter =
    require("./routes/smartAssistantSettingsRoute");

// Files
const filesRoute =
    require("./routes/files");

const pushRoutes =
    require("./routes/push.routes");


    const rubikaNotificationRoutes =
    require("./routes/rubikaNotification.routes");
// ======================================================
// BOTS
// ======================================================

const rubikaBot =
    require("./rubika/bot");

const startRubikaBot =
    require("./rubika-bot/riseo");


// Telegram فعلاً غیرفعال است
let telegramBot = null;

try {

    // telegramBot = require("./telegram/bot");

} catch (error) {

    console.log(
        "Telegram bot file not found yet ⚠️"
    );

}


const notificationBot = require("./rubika-notification-bot");

// ======================================================
// APP
// ======================================================

const app = express();


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors()
);

app.use(
    express.json({
        strict: false
    })
);


// ======================================================
// API ROUTES
// ======================================================


// ------------------------------
// Authentication
// ------------------------------

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/password-reset",
    passwordResetRoutes
);


// ------------------------------
// Admin
// ------------------------------

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/admin/tests",
    adminTestRoutes
);

app.use(
    "/api/admin/results",
    adminResultsRoutes
);

app.use(
    "/api/admin/analysis",
    adminAnalysisRoutes
);

app.use(
    "/api/ai-admin",
    aiAdminRoute
);


// ------------------------------
// Plans
// ------------------------------

app.use(
    "/api/plans",
    planRoutes
);

app.use(
    "/api/planner-ai",
    plannerAIRoutes
);


// ------------------------------
// AI
// ------------------------------

app.use(
    "/api/ai",
    aiRoutes
);


// ------------------------------
// Chat
// ------------------------------

app.use(
    "/api/chat",
    chatRoutes
);


// ------------------------------
// Tests
// ------------------------------

app.use(
    "/api/tests",
    testRoutes
);


// ------------------------------
// Exams
// ------------------------------

app.use(
    "/api/exams",
    examResultsRoute
);

app.use(
    "/api/exam-submission",
    examSubmissionRoute
);

app.use(
    "/api/exam-answers",
    examAnswersRoutes
);


// ------------------------------
// Results
// ------------------------------

app.use(
    "/api/results",
    resultRoutes
);

app.use(
    "/api/results",
    userResultsRoutes
);


// ------------------------------
// Analysis
// ------------------------------

app.use(
    "/api/analysis",
    analysisRoutes
);


// ------------------------------
// Smart Assistant
// ------------------------------

app.use(
    "/api/smart-assistant",
    smartAssistantRouter
);

app.use(
    "/api/smart-assistant/context",
    smartAssistantContextRouter
);

app.use(
    "/api/smart-assistant/settings",
    smartAssistantSettingsRouter
);


// ------------------------------
// Files
// ------------------------------

app.use(
    "/api/files",
    filesRoute
);

app.use(
    "/api/notifications/rubika",
    rubikaNotificationRoutes
);
// ======================================================
// STATIC FILES
// ======================================================

app.use(
    "/temp-files",
    express.static(
        path.join(
            __dirname,
            "temp-files"
        )
    )
);


app.use(
    "/workspace1",
    express.static(
        path.join(
            __dirname,
            "workspace1"
        )
    )
);


// ======================================================
// TEST ROUTE
// ======================================================

app.post(
    "/api/test-plan",
    (req, res) => {

        res.json({
            success: true,
            message: "POST OK"
        });

    }
);


app.use(
    "/api/push",
    pushRoutes
);

// ======================================================
// HOME
// ======================================================

app.get(
    "/",
    (req, res) => {

        res.send(
            "Server is running 🚀"
        );

    }
);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
    "/api/health",
    (req, res) => {

        res.status(200).json({

            success: true,

            status: "online",

            message: "Server is healthy 🚀"

        });

    }
);


// ======================================================
// SERVER CONFIG
// ======================================================

const PORT =
    process.env.PORT || 3000;


// ======================================================
// START SERVER
// ======================================================

async function startServer() {

    try {

        // ------------------------------------------
        // MongoDB
        // ------------------------------------------

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB connected ✅"
        );


        // ------------------------------------------
        // Rubika Bot
        // ------------------------------------------

        try {

            rubikaBot.startBot();

            console.log(
                "Rubika bot started ✅"
            );

        } catch (error) {

            console.log(
                "Rubika bot error ❌",
                error.message
            );

        }


        // ------------------------------------------
        // Riseo Bot
        // ------------------------------------------

        try {

            startRubikaBot();

            console.log(
                "Riseo file bot started ✅"
            );

        } catch (error) {

            console.log(
                "Riseo bot error ❌",
                error.message
            );

        }


        // ------------------------------------------
        // Telegram Bot
        // ------------------------------------------

        if (telegramBot) {

            try {

                telegramBot.startBot();

                console.log(
                    "Telegram bot started ✅"
                );

            } catch (error) {

                console.log(
                    "Telegram bot error ❌",
                    error.message
                );

            }

        }


        notificationBot.startBot();


        // ------------------------------------------
        // HTTP Server
        // ------------------------------------------

        app.listen(
            PORT,
            () => {

                console.log(
                    `Server running on port ${PORT} 🚀`
                );

            }
        );


    } catch (error) {

        console.error(
            "Startup Error ❌",
            error
        );

        process.exit(1);

    }

}


// ======================================================
// START
// ======================================================

startServer();