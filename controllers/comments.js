//Imports
const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.js");
const Users = require("../models/Users.js")(sequelize, DataTypes);
const Comments = require("../models/Comments.js")(sequelize, DataTypes);

//Comments creation
exports.createComment = (req, res, next) => {
  //Join
  Comments.belongsTo(Users);
  Users.hasMany(Comments);
  //If empty
  if (req.body.message === "") {
    return res.status(400).json({ error: "Votre commentaire est vide" });
  }
  //Object
  Comments.create({
    message: req.body.message,
    postId: req.params.postId,
    userId: req.auth.userId,
  })
    //Creation
    .then(() => {
      res.status(201).json({ message: "Commentaire crée" });
    })
    .catch((error) => {
      console.log(error);
      res.status(400).json({ error });
    });
};

//Get all comments of a single post
exports.getAllComments = (req, res, next) => {
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
  Comments.belongsTo(Users);
  Users.hasMany(Comments);

  //Datas
  const options = {
    where: { postId: req.params.postId },
    distinct: true,
    subQuery: false,
    limit: size,
    offset: (page - 1) * size,
    order: [["id", "DESC"]],
    attributes: ["id", "userId", "postId", "message", "created"],
    include: {
      model: Users,
      attributes: ["firstname", "image"],
    },
  };
  //Retrieve comments
  Comments.findAndCountAll(options)
    .then((comments) => {
      res.status(200).json({
        comments,
        currentPage: page,
        totalPages: Math.ceil(comments.count / size),
      });
    })
    .catch(() => {
      res
        .status(404)
        .json({ error: "Impossible de retrouver les commentaires" });
    });
};

//Get one comment of a post
exports.getOneComment = (req, res, next) => {
  //Join
  Comments.belongsTo(Users);
  Users.hasMany(Comments);

  //Datas
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
      //If not in database
      if (!comment) {
        return res.status(404).json({ error: "Commentaire non trouvé" });
      }
      res.status(200).json(comment);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
};

//Update comment
exports.editComment = (req, res, next) => {
  Comments.findOne({ where: { id: req.params.id } })
    .then((comment) => {
      //If not the author
      if (comment.userId !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      //If empty
      if (req.body.message === null) {
        return res.status(400).json({ error: "Votre commentaire est vide" });
      }
      //Updating
      comment
        .update({ message: req.body.message, id: req.params.id })
        .then(() => res.status(200).json({ message: "Commentaire modifié" }));
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

//Delete a comment
exports.deleteComment = (req, res, next) => {
  Comments.findOne({ where: { id: req.params.id } })
    .then((comment) => {
      //If not the author or not admin
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
