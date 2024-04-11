const express = require("express");

const router = express.Router();

const userController = require("../controllers/user");
const auth = require("../middlewares/auth");

router.get("/", auth, userController.getUsersForSidebar);

module.exports = router;