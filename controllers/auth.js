const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
//const schemaPassword = require("../models/passwordValidator.js");
const User = require("../models/Users.js")(sequelize, DataTypes);
const Token = require("../models/Token.js")(sequelize, DataTypes);
const fs = require("fs");
const crypto = require("crypto");
const { encryptEmail, decryptEmail } = require("../middlewares/crypto.js");
const regex = require("../functions/regex.js");
const emailSignup = require("../middlewares/emailSignup.js");
const emailResetPassword = require("../middlewares/emailResetPassword.js");
const moment = require("moment");

//Fonction signup
exports.signup = (req, res, next) => {
  User.findOne({
    where: { email: req.body.email },
  })
    .then((user) => {
      //Vérification des champs + regex
      if (
        req.body.firstname === "" &&
        req.body.lastname === "" &&
        req.body.email === "" &&
        req.body.password === ""
      ) {
        return res.status(400).send({
          error: `Tous les champs doivent etre complétés`,
        });
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

      if (regex.testEmail(req.body.email) === false || req.body.email === "") {
        return res.status(400).send({
          error: `Merci de vérifier votre email, format invalide`,
        });
      }

      if (
        regex.testPassword(req.body.password) === false ||
        req.body.password === ""
      ) {
        return res.status(400).send({
          error: `Le mot de passe doit contenir au moins : 8 caractères minimum, une majuscule, une minuscule, un chiffre, et un caractère spécial`,
        });
      }
      if (!user) {
        //On rentre les différents champs en bdd
        bcrypt.hash(req.body.password, 10).then((hash) => {
          User.create({
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: encryptEmail(req.body.email),
            password: hash,
            image: `http://localhost:${process.env.PORT_SERVER}/images/user/default.png`,
            isConfirmed: false,
            isAdmin: false,
          })
            .then((newUser) => {
              emailSignup.sendMail(
                decryptEmail(newUser.email),
                emailSignup.confirmedAccount.confirm(newUser.id)
              );
            })
            .then(() =>
              res.status(201).json({ message: emailSignup.messages.confirm })
            )
            .catch(() =>
              res.status(400).json({ error: "Veuillez vérifier vos champs" })
            );
        });
      } // We have already seen this email address. But the user has not
      // clicked on the confirmation link. Send another confirmation email.
      else if (user && !user.isConfirmed) {
        emailSignup
          .sendEmail(
            decryptEmail(user.email),
            emailSignup.confirmedAccount.confirm(user.id)
          )
          .then(() =>
            res.status(200).json({ message: emailSignup.messages.resend })
          );
      }

      // The user has already confirmed this email address
      else {
        res
          .status(200)
          .json({ message: emailSignup.messages.alreadyConfirmed });
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

//Fonction login
exports.login = (req, res, next) => {
  //Recherche de User dans la bdd
  User.findOne({
    where: {
      email: encryptEmail(req.body.email),
    },
  })
    //Si non trouvé 401
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .send({ error: `Adresse mail ou mot de passe incorrect` });
      }

      if (user.isConfirmed === false) {
        return res
          .status(401)
          .send({ error: `Votre compte n'est pas confirmé` });
      }
      //Utilisation de bcrypt pour la comparaison du mot de passe
      bcrypt
        .compare(req.body.password, user.password)
        //Si invalide 401
        .then((valid) => {
          if (!valid) {
            return res
              .status(401)
              .send({ error: `Adresse mail ou mot de passe incorrect` });
          }
          //sinon 200 + création d'un token valable 1 semaine
          const maxAge = 1 * (168 * 60 * 60 * 1000);
          res.status(200).json({
            userId: user.id,
            isAdmin: user.isAdmin,
            token: jwt.sign(
              { userId: user.id, isAdmin: user.isAdmin },
              process.env.TOKEN_KEY,
              {
                expiresIn: maxAge,
              }
            ),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    //Gestion de l'erreur en 500 (server response)
    .catch((error) => res.status(500).json({ error }));
};

// The callback that is invoked when the user visits the confirmation
// url on the client and a fetch request is sent in componentDidMount.
exports.confirmEmail = (req, res) => {
  User.findOne({ where: { id: req.params.id } })
    .then((user) => {
      // A user with that id does not exist in the DB. Perhaps some tricky
      // user tried to go to a different url than the one provided in the
      // confirmation email.
      if (!user) {
        return res
          .status(200)
          .json({ message: emailSignup.messages.couldNotFind });
      }

      if (user.isConfirmed === true) {
        return res
          .status(200)
          .json({ message: emailSignup.messages.alreadyConfirmed });
      }

      user
        .update({ isConfirmed: true }, { where: { id: req.params.id } })
        .then(() =>
          res.status(200).json({ message: emailSignup.messages.confirmed })
        )
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

//Fonction login
exports.emailResetPassword = (req, res, next) => {
  //Recherche de User dans la bdd
  User.findOne({
    where: {
      email: encryptEmail(req.body.email),
    },
  })
    //Si non trouvé 401
    .then((user) => {
      if (!user) {
        return res.status(401).send({ error: `Adresse mail incorrect` });
      }

      Token.create({
        userId: user.id,
        token: jwt.sign({ userId: user.id }, process.env.TOKEN_KEY, {
          expiresIn: 3600,
        }),
      })
        .then((token) => {
          emailResetPassword.sendMail(
            decryptEmail(user.email),
            emailResetPassword.confirmedResetPassword.confirm(token.id)
          );
        })
        .then(() =>
          res.status(201).json({ message: emailResetPassword.messages.confirm })
        );
    })
    //Gestion de l'erreur en 404 (server response)
    .catch((error) => res.status(404).json({ error }));
};

//Recherche d'un utilisateur
exports.getResetPassword = (req, res, next) => {
  Token.findOne({
    where: { id: req.params.id },
  })
    .then((token) => {
      if (!token) {
        return res.status(404).json({ error: "Aucune donnée" });
      }
      res.status(200).send({ message: "Ok" });
    })
    .catch(() => {
      res.status(404).json({ error: "Aucune donnée" });
    });
};

exports.resetPassword = (req, res, next) => {
  Token.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      if (!user) {
        return res
          .status(200)
          .json({ message: emailResetPassword.messages.couldNotFind });
      }
      if (
        regex.testPassword(req.body.password) === false ||
        req.body.password === ""
      ) {
        return res.status(400).send({
          error: `Le mot de passe doit contenir au moins : 8 caractères minimum, une majuscule, une minuscule, un chiffre, et un caractère spécial`,
        });
      }

      if (moment().format() > moment(user.creation).add(1, "h").format()) {
        Token.destroy({ where: { id: req.params.id } });
        return res
          .status(400)
          .json({ message: emailResetPassword.messages.expire });
      }

      const setPassword = {
        password: req.body.password,
        confirmNewPassword: req.body.confirmNewPassword,
      };

      if (setPassword.password === setPassword.confirmNewPassword) {
        bcrypt.hash(setPassword.password, 10).then((hash) => {
          User.update(
            {
              password: hash,
              id: req.params.id,
            },
            { where: { id: user.userId } }
          )
            .then(() => {
              res.status(200).json({
                message: emailResetPassword.messages.confirmed,
              });
              Token.destroy({ where: { id: req.params.id } });
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
