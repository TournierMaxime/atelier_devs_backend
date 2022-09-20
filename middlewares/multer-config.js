//Importation de multer
const multer = require("multer");

//Extensions valide pour les photos
const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
  "image/png": "png",
};
//Dossier de destination
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const pathRoute = req.originalUrl;
    if (pathRoute === `/api/users/${req.params.id}`)
      callback(null, "images/user");
    if (pathRoute === "/api/posts/new") callback(null, "images/post");
    if (pathRoute === `/api/posts/${req.params.id}`)
      callback(null, "images/post");
  },
  //Formats du fichiers dans son appelation
  filename: (req, file, callback) => {
    const pathRoute = req.originalUrl;
    //On supprime l'extension de fichier
    const nameUserId = req.params.id;
    const namePostTitle = req.body.title;
    //On vérifie si l'extension est acceptée
    const extension = MIME_TYPES[file.mimetype];
    //photo_date.extension
    if (pathRoute === `/api/users/${req.params.id}`) {
      callback(null, nameUserId + "." + extension);
    }
    if (pathRoute === `/api/posts/new`) {
      callback(null, namePostTitle.split(" ").join("-") + "." + extension);
    }
    if (pathRoute === `/api/posts/${req.params.id}`) {
      callback(null, namePostTitle.split(" ").join("-") + "." + extension);
    }
  },
});

const upload = multer({
  fileFilter: (req, file, cb) => {
    /* on récupère l'extension de notre image et 
    on applique une regex pour définir les extensions que l'on souhaite
    accepter au sein du middleware */
    const ext = file.mimetype.split("/")[1];
    const regExt = /^png|jpg|jpeg$/;
    if (regExt.test(ext)) cb(null, true);
    if (!regExt.test(ext)) cb({ error: "Type de fichier non accepté" });
  },

  // on impose une limite de taille à l'image de 3mo
  limits: { fileSize: 3145728 },

  storage,
  // image sera le champ dédié aux fichiers images dans le formData
}).single("image");
//Exportation du module
module.exports = (req, res, next) => {
  upload(req, res, (err) => (err ? res.status(400).json(err) : next()));
};
//module.exports = multer({ storage: storage }).single("image");
