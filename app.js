//Imports
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

//Express use
const app = express();

//Headers protection
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.crossOriginResourcePolicy({ policy: "same-site" }));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

//CORS
app.use(cors());

//Database connection + sync
connectToDatabase();
sync();

app.use(express.json());

//Middlewares for images folders
app.use("/images", express.static(path.join(__dirname, "images")));

//Middleware for the authentification
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;
