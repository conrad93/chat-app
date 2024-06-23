const express = require("express");

const router = express.Router();

const messageController = require("../controllers/message");
const auth = require("../middlewares/auth");

router.post("/send/:id", auth, messageController.sendMessage);
router.get("/:id", auth, messageController.getMessages);

module.exports = router;