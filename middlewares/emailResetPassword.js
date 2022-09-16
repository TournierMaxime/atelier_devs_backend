const dotenv = require("dotenv");
dotenv.config();
const nodemailer = require("nodemailer");

// The credentials for the email account you want to send mail from.
const credentials = {
  host: process.env.EMAIL_PROVIDER,
  port: 465,
  secure: true,
  auth: {
    // These environment variables will be pulled from the .env file
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Getting Nodemailer all setup with the credentials for when the 'sendEmail()'
// function is called.
const transporter = nodemailer.createTransport(credentials);

// exporting an 'async' function here allows 'await' to be used
// as the return value of this function.
exports.sendMail = async (to, content) => {
  // The from and to addresses for the email that is about to be sent.
  const contacts = {
    from: `Ateliers des Devs <${process.env.EMAIL_ADDRESS}>`,
    to,
  };

  // Combining the content and contacts into a single object that can
  // be passed to Nodemailer.
  const email = Object.assign({}, content, contacts);

  // This file is imported into the controller as 'sendEmail'. Because
  // 'transporter.sendMail()' below returns a promise we can write code like this
  // in the contoller when we are using the sendEmail() function.
  //
  //  sendEmail()
  //   .then(() => doSomethingElse())
  //
  // If you are running into errors getting Nodemailer working, wrap the following
  // line in a try/catch. Most likely is not loading the credentials properly in
  // the .env file or failing to allow unsafe apps in your gmail settings.

  await transporter.sendMail(email);
};

exports.confirmedResetPassword = {
  confirm: (id) => ({
    subject: "Récupération mot de passe Atelier des Devs",
    html: `
      <h1 style="font-size:1.4em">Récupération mot de passe de l'Ateliers des Devs</h1>
        <a href='${process.env.URLWEBSITE}/resetPassword/${id}'>
          Cliquez ici pour modifier votre mot de passe.
        </a><br/>
        <i>Ce mail est un message automatique. Merci de ne pas y répondre.</i>
      `,
  }),
};

exports.messages = {
  confirm:
    "Un email de récupération de mot de passe vous a été envoyé. Pensez à vérifier vos spams.",
  confirmed: "Votre mot de passe a bien été modifié !",
  resend:
    "Un nouveau email de récupération de mot de passe vous a été envoyé. Pensez à vérifier vos spams.",
  couldNotFind: "Compte introuvable.",
  alreadyConfirmed: "Votre mot de passe a déjà été modifié !",
  expire: "Votre lien a expiré",
};
