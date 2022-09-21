//Regex
exports.testFirstName = (firstname) => {
  const regexFirstName = /^[a-zA-Z\s-]{3,35}$/;
  return regexFirstName.test(firstname);
};

exports.testLastName = (lastname) => {
  const regexLastName = /^[a-zA-Z\s-]{3,35}$/;
  return regexLastName.test(lastname);
};

exports.testEmail = (email) => {
  const regexEmail = /^([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/;
  return regexEmail.test(email);
};

exports.testPassword = (password) => {
  const regexPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$/;
  return regexPassword.test(password);
};
