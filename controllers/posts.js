const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.js");
const Posts = require("../models/Posts.js")(sequelize, DataTypes);
const Users = require("../models/Users.js")(sequelize, DataTypes);
const Comments = require("../models/Comments.js")(sequelize, DataTypes);
const fs = require("fs");

//Création d'un post
exports.createPost = (req, res, next) => {
  //Jointure des tables Users et Posts
  Posts.belongsTo(Users);
  Users.hasMany(Posts);

  //Si l'utilisateur décide d'importer un image
  const postObject = req.file
    ? {
        title: req.body.title,
        message: req.body.message,
        image: `${req.protocol}://${req.get("host")}/images/post/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  //Création
  Posts.create({
    ...postObject,
    userId: req.auth.userId,
  })
    //On joint les datas de Users
    .then(() => {
      res.status(200).json({ message: "Post crée" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};
//Récupère tous les posts
exports.getAllPosts = (req, res, next) => {
  //Jointure des tables Users et Posts
  Posts.belongsTo(Users);
  Comments.belongsTo(Posts);
  Users.hasMany(Posts);
  Posts.hasMany(Comments);
  //Utilisation des datas Posts et Users
  const options = {
    order: [["id", "DESC"]],
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
  Posts.findAll(options)
    .then((posts) => {
      res.status(200).json({ posts });
    })
    .catch(() => {
      res.status(404).json({ error: "Impossible de retrouver les posts" });
    });
};
//Récupération d'un post
exports.getOnePost = (req, res, next) => {
  //Jointure des tables Users et Posts
  Posts.belongsTo(Users);
  Users.hasMany(Posts);
  Comments.belongsTo(Posts);
  Posts.hasMany(Comments);

  //Utilisation des datas Posts et Users
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
      if (!post) {
        return res.status(404).json({ error: "Post non trouvé" });
      }
      res.status(200).json(post);
    })

    .catch(() => {
      return res.status(404).json({ error: "Post non trouvé" });
    });
};

//Edition d'un post
exports.editPost = (req, res, next) => {
  Posts.findOne({ where: { id: req.params.id } })
    .then((post) => {
      //L'utilisateur doit etre l'auteur du post pour modifier
      if (post.userId !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      //Si ajout d'un fichier
      const postObject = req.file
        ? {
            title: req.body.title,
            message: req.body.message,
            image: `${req.protocol}://${req.get("host")}/images/post/${
              req.file.filename
            }`,
          }
        : { ...req.body };

      //Maj du post
      post
        .update({ ...postObject, id: req.params.id })
        .then(() => res.status(200).json({ message: "Post modifié" }));
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};
//Suppression du post
exports.deletePost = (req, res, next) => {
  Comments.destroy({ where: { postId: req.params.id } })
    .then(() => {
      Posts.findOne({ where: { id: req.params.id } })
        .then((post) => {
          //L'utilisateur doit etre l'auteur du post pour supprimer ou admin
          if (post.userId !== req.auth.userId && req.auth.isAdmin === false) {
            return res.status(403).json({ error: "Accès non autorisé" });
          }
          //Suppression de l'image dans le dossier images
          if (post.image) {
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

exports.deletePostImage = (req, res, next) => {
  Posts.findOne({ where: { id: req.params.id } })
    .then((post) => {
      if (post.userId !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const filename = post.image.split("/images/post/")[1];
      fs.unlink(`images/post/${filename}`, () => {
        //Suppression du post
        post.update({ image: null });
        res.status(200).json({ message: "Image supprimée" });
      });
    })
    .catch(() => {
      res.status(404).json({ error: "Post non trouvé" });
    });
};
