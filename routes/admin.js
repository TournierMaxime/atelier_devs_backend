//Imports
const express = require("express");
const router = express.Router();

//Middlewares
const auth = require("../middlewares/auth.js");

//Controllers
const roleCtrl = require("../controllers/admin.js");

//Routes
router.post("/:id/setRole", auth, roleCtrl.setRole);
router.get("/comments", auth, roleCtrl.getAllComments);

module.exports = router;
