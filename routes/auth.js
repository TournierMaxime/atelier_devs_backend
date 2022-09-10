const express = require("express");
const router = express.Router();
//Controllers
const userCtrl = require("../controllers/auth.js");
//Routes
router.post("/signup", userCtrl.signup);
router.post("/login", userCtrl.login);

module.exports = router;
