// ======================================================
// LOAD ENV + DNS
// ======================================================

require("dotenv").config();

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



// ======================================================
// ROUTES
// ======================================================

const authRoutes = require("./routes/auth");
const passwordResetRoutes = require("./routes/passwordReset");
const adminRoutes = require("./routes/admin");
const planRoutes = require("./routes/plans");
const chatRoutes = require("./routes/chat");
const aiRoutes = require("./routes/ai-test");
const testRoutes = require("./routes/tests");
const adminTestRoutes = require("./routes/adminTests");



// ======================================================
// RUBIKA BOT
// ======================================================

const rubikaBot = require("./rubika/bot");



// ======================================================
// APP CONFIG
// ======================================================

const app = express();


app.use(
    cors()
);

app.use(
    express.json({
        strict:false
    })
);

// ======================================================
// API ROUTES
// ======================================================


app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/password-reset",
    passwordResetRoutes
);


app.use(
    "/api/admin",
    adminRoutes
);


app.use(
    "/api/plans",
    planRoutes
);


app.use(
    "/api/chat",
    chatRoutes
);


app.use(
    "/api/ai",
    aiRoutes
);


app.use(
    "/api/tests",
    testRoutes
);


app.use(
    "/api/admin/tests",
    adminTestRoutes
);






app.post("/api/test-plan",(req,res)=>{

    res.json({
        success:true,
        message:"POST OK"
    });

});
// ======================================================
// HOME
// ======================================================

app.get(
    "/",
    (req,res)=>{

        res.send(
            "Server is running 🚀"
        );

    }
);



// ======================================================
// DATABASE
// ======================================================


mongoose.connect(
    process.env.MONGO_URI
)

.then(()=>{


    console.log(
        "MongoDB connected ✅"
    );


    // شروع ربات بعد از اتصال دیتابیس

    rubikaBot.startBot();


})

.catch((error)=>{


    console.log(
        "MongoDB Error:",
        error.message
    );


});




// ======================================================
// SERVER START
// ======================================================


const PORT =
process.env.PORT || 3000;



app.listen(
    PORT,
    ()=>{


        console.log(
            `Server running on port ${PORT} 🚀`
        );


    }
);