const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.js");
const Users = require("../models/Users.js")(sequelize, DataTypes);
const Posts = require("../models/Posts.js")(sequelize, DataTypes);
const Comments = require("../models/Comments.js")(sequelize, DataTypes);
const bcrypt = require("bcrypt");
const fs = require("fs");
const { encryptEmail, decryptEmail } = require("../middlewares/crypto.js");
const regex = require("../functions/regex.js");
//Edition d'un utilisateur
exports.editUser = (req, res, next) => {
  Users.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      //On doit etre propriétaire pour pouvoir éditer
      if (user.id !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      if (
        regex.testFirstName(req.body.firstname) === false ||
        req.body.firstname === ""
      ) {
        return res.status(400).send({
          error: `Merci de vérifier votre prénom, 3 caractères minimum requis avec des lettres uniquement`,
        });
      }

      if (
        regex.testLastName(req.body.lastname) === false ||
        req.body.lastname === ""
      ) {
        return res.status(400).send({
          error: `Merci de vérifier votre nom, 3 caractères minimum requis avec des lettres uniquement`,
        });
      }

      const userObject = req.file
        ? //Si édition du profil avec un fichier image
          {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            image: `${req.protocol}://${req.get("host")}/images/user/${
              req.file.filename
            }`,
          }
        : //sinon on edite le reste
          {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
          };

      user
        .update({
          ...userObject,
          id: req.params.id,
        })
        .then(() =>
          res
            .status(200)
            .json({ message: "Votre profil a été modifié avec succès !" })
        )
        .catch(() => {
          res.status(400).json({ error: "Une erreur s'est produite" });
        });
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};
//Recherche d'un utilisateur
exports.getOneUser = (req, res, next) => {
  Posts.belongsTo(Users);
  Comments.belongsTo(Users);
  Users.hasMany(Posts);
  Users.hasMany(Comments);
  const options = {
    where: { id: req.params.id },
    attributes: [
      "id",
      "firstname",
      "lastname",
      "email",
      "image",
      "isAdmin",
      "created",
    ],
    include: [
      {
        model: Posts,
        attributes: ["id", "title", "message", "image", "created", "updated"],
      },
      {
        model: Comments,
        attributes: ["id", "postId", "message", "created", "updated"],
      },
    ],
  };
  Users.findOne(options)
    .then((user) => {
      if (!user) {
        return res.status(200).send({ message: "Aucune donnée" });
      }
      res.status(200).send({ user });
    })
    .catch(() => {
      res.status(404).json({ error: "Utilisateur non trouvé" });
    });
};
//Recherche de plusieurs utilisateurs
exports.getAllUsers = (req, res, next) => {
  Posts.belongsTo(Users);
  Comments.belongsTo(Users);
  Users.hasMany(Posts);
  Users.hasMany(Comments);
  const options = {
    order: [["id", "DESC"]],
    attributes: ["id", "firstname", "lastname", "image", "isAdmin", "created"],
    include: [
      {
        model: Posts,
        attributes: ["id", "title", "message", "image", "created", "updated"],
      },
      {
        model: Comments,
        attributes: ["id", "postId", "message", "created", "updated"],
      },
    ],
  };

  Users.findAll(options)
    .then((users) => {
      res.status(200).json({ users });
    })
    .catch(() =>
      res.status(404).json({ error: "Impossible de trouver les utilisateurs" })
    );
};
//Suppression d'un utilisateur et de tous ses contenus
exports.deleteOneUser = (req, res, next) => {
  Users.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      if (user.id !== req.auth.userId && req.auth.isAdmin === false) {
        return res.status(403).json({ error: "Accès non autorisé" });
      } else {
        Comments.destroy({ where: { userId: req.params.id } }).then(() =>
          Posts.findAll({ where: { userId: req.params.id } })
            .then((posts) => {
              posts.forEach((post) => {
                Comments.destroy({ where: { postId: post.id } });
                const filename = post.image;
                fs.unlink(`images/${filename}`, () => {
                  Posts.destroy({ where: { id: post.id } });
                });
              });
            })
            .then(() =>
              Users.findOne({ where: { id: req.params.id } }).then((user) => {
                const filename = user.image;
                fs.unlink(`images/user/${filename}`, () => {
                  Users.destroy({ where: { id: req.params.id } }).then(() =>
                    res.status(200).json({ message: "Compte supprimé !" })
                  );
                });
              })
            )
        );
      }
    })

    .catch(() => res.status(404).json({ error: "Compte introuvable !" }));
};

exports.setEmail = (req, res, next) => {
  Users.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      //On doit etre propriétaire pour pouvoir éditer
      if (user.id !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      if (regex.testEmail(req.body.email) === false || req.body.email === "") {
        return res.status(400).send({
          error: `Merci de vérifier votre email, format invalide`,
        });
      }

      const emailObject = {
        email: encryptEmail(req.body.email),
      };
      user
        .update({
          ...emailObject,
          id: req.params.id,
        })
        .then(() => {
          res.status(200).json({
            message: "Votre email à bien été modifié !",
          });
        })
        .catch((error) => {
          res.status(400).json({ error });
        });
    })
    .catch(() => {
      res.status(404).json({ error: "Utilisateur non trouvé" });
    });
};

exports.setPassword = (req, res, next) => {
  Users.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      //On doit etre propriétaire pour pouvoir éditer
      if (user.id !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      if (
        regex.testPassword(req.body.password) === false ||
        req.body.password === ""
      ) {
        return res.status(400).send({
          error: `Le mot de passe doit contenir au moins : 8 caractères minimum, une majuscule, une minuscule, un chiffre, et un caractère spécial`,
        });
      }

      const setPassword = {
        password: req.body.password,
        confirmNewPassword: req.body.confirmNewPassword,
      };

      if (setPassword.password === setPassword.confirmNewPassword) {
        bcrypt.hash(setPassword.password, 10).then((hash) => {
          user
            .update({
              password: hash,
              id: req.params.id,
            })
            .then(() => {
              res.status(200).json({
                message: "Votre mot de passe a été modifié avec succès !",
              });
            })
            .catch((error) => {
              res.status(400).json({ error });
            });
        });
      } else {
        return res
          .status(400)
          .send({ error: `Les mots de passe ne correspondent pas` });
      }
    })
    .catch(() => {
      res.status(404).json({ error: "Utilisateur non trouvé" });
    });
};
