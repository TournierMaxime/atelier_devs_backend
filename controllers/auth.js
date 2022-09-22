//Imports
const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/Users.js")(sequelize, DataTypes);
const Token = require("../models/Token.js")(sequelize, DataTypes);
const fs = require("fs");
const crypto = require("crypto");
const { encryptEmail, decryptEmail } = require("../middlewares/crypto.js");
const regex = require("../functions/regex.js");
const emailSignup = require("../middlewares/emailSignup.js");
const emailResetPassword = require("../middlewares/emailResetPassword.js");
const moment = require("moment");

//SignUp form
exports.signup = (req, res, next) => {
  User.findOne({
    where: { email: req.body.email },
  })
    .then((user) => {
      //Regex checks
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

      //Check if the user is not in database
      if (!user) {
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

//Login form
exports.login = (req, res, next) => {
  //Check if the user is in database
  User.findOne({
    where: {
      email: encryptEmail(req.body.email),
    },
  })
    .then((user) => {
      //If not 401
      if (!user) {
        return res
          .status(401)
          .send({ error: `Adresse mail ou mot de passe incorrect` });
      }
      //If not confirmed 401
      if (user.isConfirmed === false) {
        return res
          .status(401)
          .send({ error: `Votre compte n'est pas confirmé` });
      }

      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          //If datas are not valid
          if (!valid) {
            return res
              .status(401)
              .send({ error: `Adresse mail ou mot de passe incorrect` });
          }
          //If succes token creation + access
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
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

//Confirm account
exports.confirmEmail = (req, res) => {
  User.findOne({ where: { id: req.params.id } })
    .then((user) => {
      //If not present in database
      if (!user) {
        return res
          .status(200)
          .json({ message: emailSignup.messages.couldNotFind });
      }
      //If confirmed value passed to true
      user
        .update({ isConfirmed: true }, { where: { id: req.params.id } })
        .then(() =>
          res.status(200).json({ message: emailSignup.messages.confirmed })
        )
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

//Reset password email
exports.emailResetPassword = (req, res, next) => {
  //Check if the user is in database
  User.findOne({
    where: {
      email: encryptEmail(req.body.email),
    },
  })
    .then((user) => {
      //If not in database
      if (!user) {
        return res.status(401).send({ error: `Adresse mail incorrect` });
      }
      //Else creation of a token for 1 hour
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
    .catch((error) => res.status(404).json({ error }));
};

//Reset password page
exports.getResetPassword = (req, res, next) => {
  Token.findOne({
    where: { id: req.params.id },
  })
    .then((token) => {
      //If token not in database
      if (!token) {
        return res.status(404).json({ error: "Aucune donnée" });
      }
      res.status(200).send({ message: "Ok" });
    })
    .catch(() => {
      res.status(404).json({ error: "Aucune donnée" });
    });
};

//Reset password form
exports.resetPassword = (req, res, next) => {
  Token.findOne({
    where: { id: req.params.id },
  })
    .then((user) => {
      //If not in database
      if (!user) {
        return res
          .status(200)
          .json({ message: emailResetPassword.messages.couldNotFind });
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
      //If 1 hour has spent, destruction of the token
      if (moment().format() > moment(user.creation).add(1, "h").format()) {
        Token.destroy({ where: { id: req.params.id } });
        return res
          .status(400)
          .json({ message: emailResetPassword.messages.expire });
      }
      //Object password
      const setPassword = {
        password: req.body.password,
        confirmNewPassword: req.body.confirmNewPassword,
      };
      //Password checks
      if (setPassword.password === setPassword.confirmNewPassword) {
        bcrypt.hash(setPassword.password, 10).then((hash) => {
          User.update(
            {
              password: hash,
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
        //Password not identic
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
