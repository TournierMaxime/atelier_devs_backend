const dotenv = require("dotenv");
dotenv.config();
const cryptojs = require("crypto-js");

// ============================================================
// ------------------------- Variables --------------------------

const EMAIL_CRYPTOJS_KEY = process.env.EMAIL_CRYPTOJS_KEY;

// ---------------------- Crypto functions -------------------------

const encryptEmail = (email) => {
  return cryptojs.HmacSHA256(email, EMAIL_CRYPTOJS_KEY).toString();
};

// ============================================================
// ------------------------- EXPORT ---------------------------

module.exports = { encryptEmail };
