//Importation de jsonwebtoken
const jwt = require("jsonwebtoken");
//Exportation du module
module.exports = (req, res, next) => {
  try {
    //Token lié à l'id de l'utilisateur
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);
    const userId = decodedToken.userId;
    const isAdmin = decodedToken.isAdmin;
    req.auth = { userId, isAdmin };
    //Si incorrect utilisateur invalide
    if (req.body.userId && req.body.userId !== userId) {
      throw "Invalid user ID";
    } else {
      next();
    }
    //Gestion des erreurs
  } catch {
    res.status(401).json({
      error: new Error("Invalid request!"),
    });
  }
};
