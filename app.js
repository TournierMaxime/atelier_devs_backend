//Dependances
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const { connectToDatabase, sync } = require("./config/database.js");
//Routes
const authRoutes = require("./routes/auth.js");
const usersRoutes = require("./routes/users.js");
const postsRoutes = require("./routes/posts.js");
const adminRoutes = require("./routes/admin.js");

//Utilisation d'express
const app = express();
//Protection des en-tetes headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.crossOriginResourcePolicy({ policy: "same-site" }));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

//CORS
app.use(cors());

//Connexion + sync de la bdd
connectToDatabase();
sync();

app.use(express.json());

//Middleware pour le dossier images
app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/", (req, res) => {
  return res.send("Hello World");
});

//Middleware pour l'authentification
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;
