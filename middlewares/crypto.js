//Imports
const dotenv = require("dotenv");
dotenv.config();
const cryptojs = require("crypto-js");

//Variables
const key = cryptojs.enc.Hex.parse(process.env.EMAIL_CRYPTOJS_KEY);
const iv = cryptojs.enc.Hex.parse(process.env.EMAIL_CRYPTOJS_IV);

//Fonctions
const encryptEmail = (email) => {
  return cryptojs.AES.encrypt(email, key, { iv: iv }).toString();
};

const decryptEmail = (email) => {
  return cryptojs.AES.decrypt(email, key, { iv: iv }).toString(
    cryptojs.enc.Utf8
  );
};

/*const encryptEmail = (email) => {
  return cryptojs.HmacSHA256(email, EMAIL_CRYPTOJS_KEY).toString();
};*/

module.exports = { encryptEmail, decryptEmail };
