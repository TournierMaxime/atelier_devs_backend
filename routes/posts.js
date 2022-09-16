const express = require("express");
const router = express.Router();
//Controllers
const postsCtrl = require("../controllers/posts.js");
const commentsCtrl = require("../controllers/comments.js");
//Middlewares
const auth = require("../middlewares/auth.js");
const multer = require("../middlewares/multer-config.js");
//Routes
router.post("/new", auth, multer, postsCtrl.createPost);
router.get("/", postsCtrl.getAllPosts);
router.get("/:id", postsCtrl.getOnePost);
router.put("/:id", auth, multer, postsCtrl.editPost);
router.delete("/:id", auth, postsCtrl.deletePost);
router.delete("/:id/img", auth, postsCtrl.deletePostImage);

router.post("/:postId/comment/new", auth, commentsCtrl.createComment);
router.get("/:postId/comment/:id", commentsCtrl.getOneComment);
router.get("/:postId/comments", commentsCtrl.getAllComments);
router.put("/:postId/comment/:id", auth, commentsCtrl.editComment);
router.delete("/comment/:id", auth, commentsCtrl.deleteComment);

module.exports = router;
