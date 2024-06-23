const express = require("express");

const router = express.Router();

const fileController = require("../controllers/file");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.post("/uploadRecording", auth, upload.tempUpload.single("video"), fileController.uploadRecording);

module.exports = router;