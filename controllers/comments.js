const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.js");
const Users = require("../models/Users.js")(sequelize, DataTypes);
const Comments = require("../models/Comments.js")(sequelize, DataTypes);

//Création de commentaire
exports.createComment = (req, res, next) => {
  //Jointure de Comments et Users
  Comments.belongsTo(Users);
  Users.hasMany(Comments);
  //Création des objets
  Comments.create({
    message: req.body.message,
    postId: req.params.postId,
    userId: req.auth.userId,
  })
    //Création du commentaire
    .then(() => {
      res.status(201).json({ message: "Commentaire crée" });
    })
    .catch((error) => {
      console.log(error);
      res.status(400).json({ error });
    });
};
//Récupération de tous les commentaires d'un membre
exports.getAllComments = (req, res, next) => {
  //Jointure de Comments et Users
  Comments.belongsTo(Users);
  Users.hasMany(Comments);
  //Data qui seront retournées
  const options = {
    where: { postId: req.params.postId },
    order: [["id", "DESC"]],
    attributes: ["id", "userId", "postId", "message", "created"],
    include: {
      model: Users,
      attributes: ["firstname", "image"],
    },
  };
  //Récupération des commentaires
  Comments.findAll(options)
    .then((comments) => {
      res.status(200).json(comments);
    })
    .catch(() => {
      res
        .status(404)
        .json({ error: "Impossible de retrouver les commentaires" });
    });
};
//Récupération d'un commentaire
exports.getOneComment = (req, res, next) => {
  //Jointure de Comments et Users
  Comments.belongsTo(Users);
  Users.hasMany(Comments);
  //Data qui seront retournées
  const options = {
    where: { postId: req.params.postId, id: req.params.id },
    attributes: ["id", "userId", "postId", "message", "created"],
    include: {
      model: Users,
      attributes: ["firstname", "image"],
    },
  };
  Comments.findOne(options)
    .then((comment) => {
      res.status(200).json(comment);
    })
    .catch(() => {
      res.status(404).json({ error: "Commentaire non trouvé" });
    });
};
//Edition d'un commentaire
exports.editComment = (req, res, next) => {
  Comments.findOne({ where: { id: req.params.id } })
    .then((comment) => {
      //Si l'utilisateur n'est pas l'auteur du commentaire = 403
      if (comment.userId !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      //Maj du commentaire
      comment
        .update({ message: req.body.message, id: req.params.id })
        .then(() => res.status(200).json({ message: "Commentaire modifié" }));
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};
//Suppresion du commentaire
exports.deleteComment = (req, res, next) => {
  Comments.findOne({ where: { id: req.params.id } })
    .then((comment) => {
      //Si l'utilisateur n'est pas l'auteur du commentaire = 403 ou non admin
      if (comment.userId !== req.auth.userId && req.auth.isAdmin === false) {
        return res.status(403).json({ error: "Accès non autorisé" });
      } else {
        comment.destroy();
        res.status(200).json({ message: "Commentaire supprimé" });
      }
    })
    .catch(() => {
      res.status(404).json({ error: "Commentaire non trouvé" });
    });
};
