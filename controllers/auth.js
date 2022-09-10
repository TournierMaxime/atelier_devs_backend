const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes } = require("sequelize");
const { sequelize } = require("../config/database.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
//const schemaPassword = require("../models/passwordValidator.js");
const User = require("../models/Users.js")(sequelize, DataTypes);
const fs = require("fs");
const { encryptEmail } = require("../middlewares/crypto.js");
const {
  testFirstName,
  testLastName,
  testEmail,
  testPassword,
} = require("../functions/regex.js");

//Fonction signup
exports.signup = (req, res, next) => {
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

  testFirstName(req.body.firstname);
  testLastName(req.body.lastname);
  testEmail(req.body.email);
  testPassword(req.body.password);

  //On rentre les différents champs en bdd
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      User.create({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: encryptEmail(req.body.email),
        password: hash,
        image: `http://localhost:${process.env.PORT_SERVER}/images/default.png`,
        isAdmin: false,
      })
        .then(() =>
          res.status(201).json({ message: "Compte crée avec succès" })
        )
        .catch(() => res.status(400).json({ error: "Email déjà utilisé" }));
    })
    .catch((error) => res.status(500).json({ error }));
};

//Fonction login
exports.login = (req, res, next) => {
  //Recherche de User dans la bdd
  User.findOne({
    where: { email: encryptEmail(req.body.email) },
  })
    //Si non trouvé 401
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .send({ error: `Adresse mail ou mot de passe incorrect` });
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
  console.log(res);
};
