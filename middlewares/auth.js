//Imports
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    //Token linked to the user id
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);
    const userId = decodedToken.userId;
    const isAdmin = decodedToken.isAdmin;
    req.auth = { userId, isAdmin };
    //If incorrect invalid user
    if (req.body.userId && req.body.userId !== userId) {
      throw "Invalid user ID";
    } else {
      next();
    }
    //Handle errors
  } catch {
    res.status(401).json({
      error: new Error("Invalid request!"),
    });
  }
};
