//Imports
const { Sequelize, DataTypes } = require("sequelize");
const Comments = require("../models/Comments.js");
const Posts = require("../models/Posts.js");
const Users = require("../models/Users.js");
const dotenv = require("dotenv");
dotenv.config();

//Sequelize instance
const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.USER,
  process.env.PASSWORD,
  {
    host: process.env.HOST,
    dialect: process.env.DIALECT,
    port: process.env.PORT_SQL,
    logging: false,
    /*pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },*/
  }
);

//Uses of models
const commentsModel = Comments(sequelize, DataTypes);
const postsModel = Posts(sequelize, DataTypes);
const usersModel = Users(sequelize, DataTypes);

//Database connection
function connectToDatabase(err) {
  if (err) {
    console.error(err);
  } else {
    sequelize.authenticate();
    console.log("Connection to database has been established successfully");
  }
}

//Database sync
function sync(err) {
  if (err) {
    console.log(err);
  } else {
    sequelize
      .sync({ alter: true })
      .then(() => console.log("Synchronization was successfull"));
  }
}

module.exports = { sequelize, connectToDatabase, sync };
