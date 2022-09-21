//Imports
const multer = require("multer");

//Valid extensions authorize
const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
  "image/png": "png",
};

//Folder destination
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const pathRoute = req.originalUrl;

    if (pathRoute === `/api/users/${req.params.id}`)
      callback(null, "images/user");

    if (pathRoute === "/api/posts/new") callback(null, "images/post");

    if (pathRoute === `/api/posts/${req.params.id}`)
      callback(null, "images/post");
  },

  //Files formats
  filename: (req, file, callback) => {
    const pathRoute = req.originalUrl;
    const nameUserId = req.params.id;
    const namePostTitle = req.body.title;

    //Checking if the extension is correct
    const extension = MIME_TYPES[file.mimetype];

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

//Uploading files
const upload = multer({
  fileFilter: (req, file, cb) => {
    //Retrieve image extension and regex is applied
    const ext = file.mimetype.split("/")[1];
    const regExt = /^png|jpg|jpeg$/;

    if (regExt.test(ext)) cb(null, true);
    if (!regExt.test(ext)) cb({ error: "Type de fichier non accepté" });
  },

  //Files limits
  limits: { fileSize: 3145728 },

  storage,
}).single("image");

module.exports = (req, res, next) => {
  upload(req, res, (err) => (err ? res.status(400).json(err) : next()));
};
//module.exports = multer({ storage: storage }).single("image");
