exports.testFirstName = (req, res) => {
  const regexFirstName = /^[a-zA-Z\s-]{3,35}$/;
  if (
    regexFirstName.test(req.body.firstname) === false ||
    req.body.firstname == ""
  ) {
    return res.status(400).send({
      error: `Merci de vérifier votre prénom, 3 caractères minimum requis avec des lettres uniquement`,
    });
  }
};

exports.testLastName = (req, res) => {
  const regexLastName = /^[a-zA-Z\s-]{3,35}$/;
  if (
    regexLastName.test(req.body.lastname) === false ||
    req.body.lastname == ""
  ) {
    return res.status(400).send({
      error: `Merci de vérifier votre nom, 3 caractères minimum requis avec des lettres uniquement`,
    });
  }
};

exports.testEmail = (req, res) => {
  const regexEmail = /^([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/;
  if (regexEmail.test(req.body.email) === false || req.body.email == "") {
    return res.status(400).send({
      error: `Erreur email non valide !`,
    });
  }
};

exports.testPassword = (req, res) => {
  const regexPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{8,}$/;
  if (
    regexPassword.test(req.body.password) === false ||
    req.body.password == ""
  ) {
    return res.status(400).send({
      error: `Le mot de passe doit contenir au moins : 8 caractères minimum, une majuscule, une minuscule, un chiffre, et un caractère spécial`,
    });
  }
};
