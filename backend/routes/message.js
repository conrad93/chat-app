const express = require("express");

const router = express.Router();

const messageController = require("../controllers/message");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.post("/send/:id", auth, messageController.sendMessage);
router.post("/sendimage/:id", auth, upload.single("imageFile"), messageController.sendImage);
router.get("/:id", auth, messageController.getMessages);
router.get("/showimage/:name", auth, messageController.showImage);

module.exports = router;