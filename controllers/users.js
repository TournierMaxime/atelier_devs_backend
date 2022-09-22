//Imports
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

//Update user datas
exports.editUser = (req, res, next) => {
  Users.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      //If not the right user
      if (user.id !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      //Regex checks
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

      //Object with or without files
      const userObject = req.file
        ? {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            image: `${req.protocol}://${req.get("host")}/images/user/${
              req.file.filename
            }`,
          }
        : {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
          };
      //Updating datas
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

//Get one user
exports.getOneUser = (req, res, next) => {
  //Join
  Posts.belongsTo(Users);
  Comments.belongsTo(Users);
  Users.hasMany(Posts);
  Users.hasMany(Comments);

  //Datas
  const options = {
    where: { id: req.params.id },
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

//Get all users
exports.getAllUsers = (req, res, next) => {
  //Pagination
  const pageAsNumber = Number(req.query.page);
  const sizeAsNumber = Number(req.query.size);
  let page = 0;
  let size = 10;

  if (!Number.isNaN(pageAsNumber) && pageAsNumber > 0) {
    page = pageAsNumber;
  }

  if (!Number.isNaN(sizeAsNumber) && sizeAsNumber > 0 && sizeAsNumber < 10) {
    size = sizeAsNumber;
  }

  //Join
  Posts.belongsTo(Users);
  Comments.belongsTo(Users);
  Users.hasMany(Posts);
  Users.hasMany(Comments);

  //Datas
  const options = {
    order: [["id", "DESC"]],
    attributes: ["id", "firstname", "lastname", "image", "isAdmin", "created"],
    /*include: [
      {
        model: Posts,
        attributes: ["id", "title", "message", "image", "created", "updated"],
      },
      {
        model: Comments,
        attributes: ["id", "postId", "message", "created", "updated"],
      },
    ],*/
  };

  Users.findAndCountAll(options)
    .then((users) => {
      res.status(200).json({
        users,
        currentPage: page,
        totalPages: Math.ceil(users.count / size),
      });
    })
    .catch(() =>
      res.status(404).json({ error: "Impossible de trouver les utilisateurs" })
    );
};

//Delete a user
exports.deleteOneUser = (req, res, next) => {
  Users.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      //If not the author or not admin
      if (user.id !== req.auth.userId && req.auth.isAdmin === false) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      //If author or admin
      if (user.id === req.auth.userId || req.auth.isAdmin === true) {
        //Find all posts
        Posts.findAll({ where: { userId: req.params.id } })
          .then((posts) => {
            posts.forEach((post) => {
              //Destroy comments and images linked to the posts
              Comments.destroy({ where: { postId: post.id } });
              const filename = post.image.split("/images/post/")[1];
              fs.unlink(`images/post/${filename}`, () => {
                Posts.destroy({ where: { id: post.id } });
              });
            });
          })
          .then(() =>
            //Find the user
            Users.findOne({ where: { id: req.params.id } }).then((user) => {
              //Delete the account and destroy images linked to the account
              if (
                user.image !==
                `${process.env.URLSERVER}/images/user/default.png`
              ) {
                const filename = user.image.split("/images/user/")[1];
                fs.unlink(`images/user/${filename}`, () => {
                  user
                    .destroy({ where: { id: req.params.id } })
                    .then(() =>
                      res.status(200).json({ message: "Compte supprimé !" })
                    );
                });
              } else {
                user
                  .destroy({ where: { id: req.params.id } })
                  .then(() =>
                    res.status(200).json({ message: "Compte supprimé !" })
                  );
              }
            })
          );
      }
    })

    .catch(() => res.status(404).json({ error: "Compte introuvable !" }));
};

//Update the email
exports.setEmail = (req, res, next) => {
  Users.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      //If not the author
      if (user.id !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      //Regex check
      if (regex.testEmail(req.body.email) === false || req.body.email === "") {
        return res.status(400).send({
          error: `Merci de vérifier votre email, format invalide`,
        });
      }
      //Object
      const emailObject = {
        email: encryptEmail(req.body.email),
      };
      //Updating data
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

//Update the password
exports.setPassword = (req, res, next) => {
  Users.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      //If not the author
      if (user.id !== req.auth.userId) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }
      //Regex check
      if (
        regex.testPassword(req.body.password) === false ||
        req.body.password === ""
      ) {
        return res.status(400).send({
          error: `Le mot de passe doit contenir au moins : 8 caractères minimum, une majuscule, une minuscule, un chiffre, et un caractère spécial`,
        });
      }
      //Object password
      const setPassword = {
        password: req.body.password,
        confirmNewPassword: req.body.confirmNewPassword,
      };
      //If passwords are identics
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
        //If passwords are not identics
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
