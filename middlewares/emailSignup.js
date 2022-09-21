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

  // Getting Nodemailer all setup with the credentials for when the 'sendEmail()'
  // function is called.
  const transporter = nodemailer.createTransport(credentials);
  // The from and to addresses for the email that is about to be sent.
  const contacts = {
    from: `Ateliers des Devs <${process.env.EMAIL_ADDRESS}>`,
    to,
  };

  // Combining the content and contacts into a single object that can be passed to Nodemailer.
  const email = Object.assign({}, content, contacts);

  await transporter.sendMail(email);
};

//Body of the email
exports.confirmedAccount = {
  confirm: (id) => ({
    subject: "Inscription Atelier des Devs",
    html: `
      <h1 style="font-size:1.4em">Bienvenue sur l'Ateliers des Devs</h1>
        <a href='${process.env.URLWEBSITE}/confirm/${id}'>
          Cliquez ici pour confirmer votre email et activer votre compte.
        </a><br/>
        <i>Ce mail est un message automatique. Merci de ne pas y répondre.</i>
      `,
  }),
};

//Messages depends on the situation
exports.messages = {
  confirm:
    "Un email de confirmation vous a été envoyé. Pensez à vérifier vos spams.",
  confirmed: "Votre compte est désormais activé !",
  resend:
    "Un nouveau email de confirmation vous a été envoyé. Pensez à vérifier vos spams.",
  couldNotFind: "Compte introuvable.",
  alreadyConfirmed: "Votre compte à déjà été confirmé !",
};
