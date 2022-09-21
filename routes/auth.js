//Imports
const express = require("express");
const router = express.Router();

//Controllers
const authCtrl = require("../controllers/auth.js");

//Routes
router.post("/signup", authCtrl.signup);
router.post("/login", authCtrl.login);
router.get("/confirm/:id", authCtrl.confirmEmail);
router.post("/emailResetPassword", authCtrl.emailResetPassword);
router.post("/resetPassword/:id", authCtrl.resetPassword);
router.get("/resetPassword/:id", authCtrl.getResetPassword);

module.exports = router;
