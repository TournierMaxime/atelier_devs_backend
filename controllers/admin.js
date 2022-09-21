//Imports
const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.js");
const Users = require("../models/Users.js")(sequelize, DataTypes);
const Comments = require("../models/Comments.js")(sequelize, DataTypes);
const fs = require("fs");

//Admin rights
exports.setRole = (req, res) => {
  Users.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      if (req.auth.userId && req.auth.isAdmin === true) {
        //Admin rights true
        if (user.isAdmin === false) {
          Users.update({ isAdmin: true }, { where: { id: req.params.id } });
          res
            .status(200)
            .json({ message: "Cet utilisateur est maintenant administrateur" });

          //Admin rights false
        } else if (user.isAdmin === true) {
          Users.update({ isAdmin: false }, { where: { id: req.params.id } });
          res.status(200).json({
            message: "Cet utilisateur est maintenant membre",
          });

          //Handle errors
        } else {
          return res.status(400).json({ error: "Une erreur est survenue" });
        }
      } else {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

//Retrieve all comments
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

  //Join Comments and Users
  Comments.belongsTo(Users);
  Users.hasMany(Comments);

  //Datas
  const options = {
    distinct: true,
    subQuery: false,
    limit: size,
    offset: (page - 1) * size,
    order: [["id", "DESC"]],
    attributes: ["id", "userId", "postId", "message", "created"],
    /*include: {
      model: Users,
      attributes: ["firstname", "image"],
    },*/
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
