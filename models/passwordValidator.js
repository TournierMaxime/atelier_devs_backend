const passwordValidator = require("password-validator");

// Create a schema
const schemaPassword = new passwordValidator();

// Add properties to it
schemaPassword
  .is()
  .min(8) // Minimum length 8
  .has()
  .uppercase() // Must have uppercase letters
  .has()
  .lowercase() // Must have lowercase letters
  .has()
  .digits(1) // Must have at least 1 digit
  .has()
  .not()
  .spaces(); // Should not have spaces

module.exports = schemaPassword;
