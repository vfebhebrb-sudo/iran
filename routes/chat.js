// ======================================================
// CHAT ROUTES V4
// CHAT / GROUP / CHANNEL / MESSAGE
// ======================================================

const express = require("express");

const router = express.Router();

const Chat = require("../models/chat");
const Message = require("../models/Message");

const mongoose = require("mongoose");

const User = require("../models/User");

const multer = require("multer");

const upload = multer({
    dest:"uploads/"
});
// ======================================================
// CREATE CHAT
// ======================================================

router.post("/create", async(req,res)=>{

try{


const {

    name,
    type,
    members,
    admins

} = req.body || {};



const chat = new Chat({

    name: name || "",


    type: type || "private",


    members: Array.isArray(members)
    ?
    members
    :
    [],


    admins: Array.isArray(admins)
    ?
    admins
    :
    []


});



await chat.save();



res.status(201).json({

    success:true,

    message:"چت ساخته شد",

    chat

});


}

catch(error){


console.log(
"CREATE CHAT ERROR:",
error
);



res.status(500).json({

    success:false,

    message:"خطای سرور",

    error:error.message

});


}


});

// ======================================================
// GET USER CHATS
// ======================================================

router.get("/user/:phone", async (req, res) => {

    try {

        const phone =
            req.params.phone;


        const chats =
            await Chat.find({

                members: phone

            })
            .sort({

                updatedAt: -1

            });


        res.json({

            success: true,

            chats

        });

    }

    catch (error) {

        console.log(
            "GET USER CHATS ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message: "خطای سرور",

            chats: []

        });

    }

});



// ======================================================
// GET ALL CHATS
// ======================================================

router.get("/all-test", async (req, res) => {

    try {

        const chats =
            await Chat.find()
            .sort({

                createdAt: -1

            });


        res.json({

            success: true,

            chats

        });

    }

    catch (error) {

        console.log(
            "GET ALL CHATS ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message: "خطای سرور",

            chats: []

        });

    }

});



// ======================================================
// SEND MESSAGE
// ======================================================

router.post(
    "/message",
    upload.single("file"),
    async (req, res) => {

    console.log("BODY:", req.body);
console.log("FILE:", req.file);

    try {

console.log("========== MESSAGE DEBUG ==========");
console.log("BODY:", req.body);
console.log("FILE:", req.file);
console.log("==================================");

const {

    chatId,
    sender,
    text,
    senderName,
    senderType

} = req.body;


const file =
    req.file
    ?
    req.file.path
    :
    null;

        if (
            !chatId ||
            !sender ||
            !text ||
            !text.trim()
        ) {

            return res.status(400).json({

                success: false,

                message: "اطلاعات پیام ناقص است"

            });

        }


        const chat =
            await Chat.findById(chatId);


        if (!chat) {

            return res.status(404).json({

                success: false,

                message: "چت پیدا نشد"

            });

        }


const finalSenderType =

    senderType
    ?

    senderType

    :

    sender === "مدیر"

    ?

    "admin"

    :

    "user";

let realSenderName = senderName;


const user = await User.findOne({
    phone: sender
});


if(user && user.fullname){

    realSenderName = user.fullname;

}


if(!realSenderName){

    realSenderName = "کاربر";

}

const newMessage =
    new Message({

        chatId: chatId,


        sender: sender,

senderName:

    finalSenderType === "admin"

    ?

    "مدیر برنامه کنکور"

    :

    realSenderName,


        senderType: finalSenderType,


        avatarType:

            finalSenderType === "admin"

            ?

            "admin"

            :

            finalSenderType === "ai"

            ?

            "ai"

            :

            "user",


        text: text.trim(),


        file: file || null

    });

        await newMessage.save();


        chat.lastMessage =
            text.trim();

        chat.updatedAt =
            new Date();


        await chat.save();


        res.status(201).json({

            success: true,

            message: "پیام با موفقیت ارسال شد",

            data: newMessage

        });

    }

    catch (error) {

        console.log(
            "SEND MESSAGE ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message: "خطای سرور"

        });

    }

});



// ======================================================
// GET MESSAGES
// ======================================================

router.get("/messages/:chatId", async (req, res) => {

    try {

        const chatId =
            req.params.chatId;


if (!mongoose.Types.ObjectId.isValid(chatId)) {

    return res.status(400).json({

        success:false,

        message:"شناسه چت نامعتبر است",

        messages:[]

    });

}


const chat =
    await Chat.findById(chatId);


        if (!chat) {

            return res.status(404).json({

                success: false,

                message: "چت پیدا نشد",

                messages: []

            });

        }


        const messages =
            await Message.find({

                chatId: chatId

            })
            .sort({

                createdAt: 1

            });


        res.json({

            success: true,

            messages

        });

    }

    catch (error) {

        console.log(
            "GET MESSAGES ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message: "خطای سرور",

            messages: []

        });

    }

});



// ======================================================
// EXPORT
// ======================================================

// ======================================================
// DELETE CHAT
// ======================================================

router.delete("/:id", async(req,res)=>{

try{


const chatId = req.params.id;


// حذف پیام های داخل چت

await Message.deleteMany({
    chatId: chatId
});


// حذف خود چت

const deletedChat =
await Chat.findByIdAndDelete(chatId);



if(!deletedChat){

return res.status(404).json({

    success:false,

    message:"چت پیدا نشد"

});

}



res.json({

    success:true,

    message:"چت حذف شد"

});


}

catch(error){


console.log(
"DELETE CHAT ERROR:",
error
);



res.status(500).json({

    success:false,

    message:"خطای سرور"

});


}


});

module.exports = router;