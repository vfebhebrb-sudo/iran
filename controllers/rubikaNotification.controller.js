const User = require("../models/User");
const notificationBot = require("../rubika-notification-bot");

// ======================================================
// GET STATUS
// ======================================================

exports.getStatus = async (req, res) => {

    try {

        const userId = req.user.userId;

        const user = await User.findById(userId).select(
            "notificationChatId notificationEnabled"
        );

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "کاربر پیدا نشد"
            });

        }

        return res.json({

            success: true,

            connected: Boolean(
                user.notificationChatId
            ),

            chatId:
                user.notificationChatId || null,

            notificationEnabled:
                Boolean(user.notificationEnabled)

        });

    } catch (error) {

        console.error(
            "Rubika notification status error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "خطای سرور"

        });

    }

};


// ======================================================
// SAVE / CONNECT CHAT ID
// ======================================================

exports.connect = async (req, res) => {

    try {

        const userId = req.user.userId;

        let {
            chatId,
            notificationEnabled
        } = req.body;


        // ----------------------------------------------
        // Validate Chat ID
        // ----------------------------------------------

        if (!chatId) {

            return res.status(400).json({

                success: false,

                message: "Chat ID وارد نشده است"

            });

        }


        // فقط رشته
        chatId = String(chatId).trim();


        // فقط عدد
if (!/^[A-Za-z0-9_-]+$/.test(chatId)) {

    return res.status(400).json({

        success: false,

        message:
            "Chat ID روبیکا نامعتبر است."

    });

}


        // ----------------------------------------------
        // Find User
        // ----------------------------------------------

        const user = await User.findById(userId);

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "کاربر پیدا نشد"

            });

        }


        // ----------------------------------------------
        // Save
        // ----------------------------------------------

        user.notificationChatId = chatId;


        if (
            typeof notificationEnabled === "boolean"
        ) {

            user.notificationEnabled =
                notificationEnabled;

        }


        await user.save();


        console.log(
            `🔔 Rubika notification Chat ID saved for user ${userId}`
        );


        return res.json({

            success: true,

            message: "Chat ID با موفقیت ذخیره شد",

            chatId:
                user.notificationChatId,

            notificationEnabled:
                user.notificationEnabled

        });

    } catch (error) {

        console.error(
            "Rubika notification connect error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "خطای سرور"

        });

    }

};


// ======================================================
// DISCONNECT
// ======================================================

exports.disconnect = async (req, res) => {

    try {

        const userId = req.user.userId;

        const user = await User.findById(userId);

        if (!user) {

            return res.status(404).json({

                success: false,

                message: "کاربر پیدا نشد"

            });

        }


        // Chat ID را پاک نمی‌کنیم
        // فقط اعلان را خاموش می‌کنیم

        user.notificationEnabled = false;

        await user.save();


        return res.json({

            success: true,

            message: "اعلان‌های روبیکا غیرفعال شد",

            chatId:
                user.notificationChatId,

            notificationEnabled: false

        });

    } catch (error) {

        console.error(
            "Rubika notification disconnect error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "خطای سرور"

        });

    }

};


// ======================================================
// TEST MESSAGE
// =====================================================

exports.test = async (req, res) => {

    try {

        const userId = req.user.userId;

        const user = await User
            .findById(userId)
            .select("notificationChatId");

        if (!user) {

            return res.status(404).json({
                success: false,
                sent: false,
                message: "کاربر پیدا نشد"
            });

        }

        if (!user.notificationChatId) {

            return res.status(400).json({
                success: false,
                sent: false,
                message: "ابتدا Chat ID روبیکا را ذخیره کنید"
            });

        }

const incomingMessage =
    typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

const message = incomingMessage || `🔔 تست اعلان روبیکا

اتصال اعلان‌های روبیکا با موفقیت انجام شد.

Chat ID شما با موفقیت ثبت شده است.`;

        console.log("");
        console.log("========================================");
        console.log("📤 RUBIKA TEST MESSAGE");
        console.log("👤 USER:", userId);
        console.log("🆔 CHAT ID:", user.notificationChatId);
        console.log("========================================");

        try {

            const result =
                await notificationBot.sendMessage(
                    user.notificationChatId,
                    message
                );

            /*
             * اگر sendMessage بدون خطا تمام شود،
             * یعنی API روبیکا درخواست را پذیرفته است.
             */

            console.log(
                "✅ Rubika test message accepted"
            );

            return res.status(200).json({

                success: true,
                sent: true,

                message:
                    "پیام تست با موفقیت برای روبیکا ارسال شد",

                result

            });

        }
        catch (sendError) {

            console.error(
                "❌ Rubika test message failed:",
                sendError.message
            );

            return res.status(502).json({

                success: false,
                sent: false,

                message:
                    sendError.message ||
                    "روبیکا پیام را قبول نکرد و ارسال نشد."

            });

        }

    }
    catch (error) {

        console.error(
            "❌ Rubika notification test error:",
            error
        );

        return res.status(500).json({

            success: false,
            sent: false,

            message:
                "خطای سرور هنگام ارسال پیام روبیکا"

        });

    }
};

