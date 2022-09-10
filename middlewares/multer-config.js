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
    callback(null, "images");
  },
  //Formats du fichiers dans son appelation
  filename: (req, file, callback) => {
    //On supprime l'extension de fichier
    const name = file.originalname.slice(0, -4);
    //On vérifie si l'extension est acceptée
    const extension = MIME_TYPES[file.mimetype];
    //photo_date.extension
    callback(null, name.concat("_") + Date.now() + "." + extension);
  },
});
//Exportation du module
module.exports = multer({ storage: storage }).single("image");
