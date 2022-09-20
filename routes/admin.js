// LIBRAIRIES
const express = require("express");
const router = express.Router();

// MIDDLEWARES
const auth = require("../middlewares/auth.js");

// CONTROLLERS
const roleCtrl = require("../controllers/admin.js");
//ROUTES
router.post("/:id/setRole", auth, roleCtrl.setRole);
router.get("/comments", auth, roleCtrl.getAllComments);

module.exports = router;
