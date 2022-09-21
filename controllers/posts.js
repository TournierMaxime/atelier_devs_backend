//Imports
const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.js");
const Posts = require("../models/Posts.js")(sequelize, DataTypes);
const Users = require("../models/Users.js")(sequelize, DataTypes);
const Comments = require("../models/Comments.js")(sequelize, DataTypes);
const fs = require("fs");

//Post creation
exports.createPost = (req, res, next) => {
  //Join
  Posts.belongsTo(Users);
  Users.hasMany(Posts);

  //If empty content
  if (req.body.title === "" || req.body.message === "") {
    return res.status(400).json({
      error: "Le titre et le contenu du post n'ont pas été renseignés",
    });
  }

  //Object with or without file
  const postObject = req.file
    ? {
        title: req.body.title,
        message: req.body.message,
        image: `${req.protocol}://${req.get("host")}/images/post/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  //Creation
  Posts.create({
    ...postObject,
    userId: req.auth.userId,
  })
    .then(() => {
      res.status(200).json({ message: "Post crée" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

//Get all posts
exports.getAllPosts = (req, res, next) => {
  //Pagination
  const pageAsNumber = Number(req.query.page);
  const sizeAsNumber = Number(req.query.size);
  let page = 0;
  let size = 10;

  if (!Number.isNaN(pageAsNumber) && pageAsNumber >= 0) {
    page = pageAsNumber;
  }

  if (!Number.isNaN(sizeAsNumber) && sizeAsNumber > 0 && sizeAsNumber < 10) {
    size = sizeAsNumber;
  }

  //Join
  Posts.belongsTo(Users);
  Comments.belongsTo(Posts);
  Users.hasMany(Posts);
  Posts.hasMany(Comments);

  //Datas
  const options = {
    distinct: true,
    subQuery: false,
    limit: size,
    offset: (page - 1) * size,
    order: [["id", "DESC"]],
    attributes: ["id", "title", "message", "image", "userId", "created"],
    include: [
      {
        model: Users,
        attributes: ["firstname", "image"],
      },
      /*{
        model: Comments,
      },*/
    ],
  };
  Posts.findAndCountAll(options)
    .then((posts) => {
      res.status(200).json({
        posts,
        currentPage: page,
        totalPages: Math.ceil(posts.count / size),
      });
    })
    .catch(() => {
      res.status(404).json({ error: "Impossible de retrouver les posts" });
    });
};

//Get one post
exports.getOnePost = (req, res, next) => {
  //Join
  Posts.belongsTo(Users);
  Users.hasMany(Posts);
  Comments.belongsTo(Posts);
  Posts.hasMany(Comments);

  //Datas
  const options = {
    where: { id: req.params.id },
    attributes: ["id", "title", "message", "image", "userId", "created"],
    include: [
      {
        model: Users,
        attributes: ["firstname", "image"],
      },
      {
        model: Comments,
      },
    ],
  };
  Posts.findOne(options)
    .then((post) => {
      //If not in database
      if (!post) {
        return res.status(404).json({ error: "Post non trouvé" });
      }
      res.status(200).json(post);
    })

    .catch(() => {
      return res.status(404).json({ error: "Post non trouvé" });
    });
};

//Update the post
exports.editPost = (req, res, next) => {
  Posts.findOne({ where: { id: req.params.id } })
    .then((post) => {
      //If not the author
      if (post.userId !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      //If content is empty
      if (req.body.title === "" || req.body.message === "") {
        return res.status(400).json({
          error: "Le titre et le contenu du post n'ont pas été renseignés",
        });
      }

      //Object with or without files
      const postObject = req.file
        ? {
            title: req.body.title,
            message: req.body.message,
            image: `${req.protocol}://${req.get("host")}/images/post/${
              req.file.filename
            }`,
          }
        : { title: req.body.title, message: req.body.message };

      //Updating datas
      post.update({ ...postObject, id: req.params.id }).then(() => {
        res.status(200).json({ message: "Post modifié" });
      });
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

//Delete a post
exports.deletePost = (req, res, next) => {
  //Comments associated are destroy
  Comments.destroy({ where: { postId: req.params.id } })
    .then(() => {
      Posts.findOne({ where: { id: req.params.id } })
        .then((post) => {
          //If not the author or not admin
          if (post.userId !== req.auth.userId && req.auth.isAdmin === false) {
            return res.status(403).json({ error: "Accès non autorisé" });
          }
          //Deleting datas with or without images
          if (post.image !== "") {
            const filename = post.image.split("/images/post/")[1];
            fs.unlink(`images/post/${filename}`, () => {
              //Suppression du post
              post.destroy();
              res.status(200).json({ message: "Post supprimé" });
            });
          } else {
            post.destroy();
            res.status(200).json({ message: "Post supprimé" });
          }
        })
        .catch(() => {
          res.status(404).json({ error: "Post non trouvé" });
        });
    })

    .catch((error) => res.status(400).json({ error }));
};

//Delete images in a post
exports.deletePostImage = (req, res, next) => {
  Posts.findOne({ where: { id: req.params.id } })
    .then((post) => {
      //If not the author
      if (post.userId !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      //Images is destroy
      const filename = post.image.split("/images/post/")[1];
      fs.unlink(`images/post/${filename}`, () => {
        post.update({ image: null });
        res.status(200).json({ message: "Image supprimée" });
      });
    })
    .catch(() => {
      res.status(404).json({ error: "Post non trouvé" });
    });
};
