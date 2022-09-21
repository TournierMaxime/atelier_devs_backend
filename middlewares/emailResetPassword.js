//Imports
const dotenv = require("dotenv");
dotenv.config();
const nodemailer = require("nodemailer");

//Email send to the user
exports.sendMail = async (to, content) => {
  // The credentials for the email account you want to send mail from.
  const credentials = {
    host: process.env.EMAIL_PROVIDER,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  const transporter = nodemailer.createTransport(credentials);
  const contacts = {
    from: `Ateliers des Devs <${process.env.EMAIL_ADDRESS}>`,
    to,
  };

  //Combining the content and contacts into a single object that can be passed to Nodemailer.
  const email = Object.assign({}, content, contacts);

  await transporter.sendMail(email);
};

//Body of the email
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

//Messages depends on the situation
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
