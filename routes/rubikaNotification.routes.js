const express = require("express");

const router = express.Router();

const authenticateUser =
    require("../middleware/auth");

const controller =
    require("../controllers/rubikaNotification.controller");


router.get(
    "/status",
    authenticateUser,
    controller.getStatus
);

router.post(
    "/connect",
    authenticateUser,
    controller.connect
);

router.post(
    "/disconnect",
    authenticateUser,
    controller.disconnect
);

router.post(
    "/test",
    authenticateUser,
    controller.test
);


module.exports = router;