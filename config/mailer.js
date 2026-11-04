// Envoi des e-mails de notification.
// En démonstration, les e-mails ne partent pas réellement : ils sont écrits
// dans le fichier logs/emails.log (on pourra brancher Nodemailer + un serveur SMTP en production).
const fs = require("fs");
const path = require("path");

function envoyer(destinataire, sujet, texte) {
  if (process.env.NODE_ENV === "test") return;
  const dir = path.join(__dirname, "..", "logs");
  fs.mkdirSync(dir, { recursive: true });
  const ligne = `[${new Date().toISOString()}] À: ${destinataire} | Sujet: ${sujet}\n${texte}\n\n`;
  fs.appendFileSync(path.join(dir, "emails.log"), ligne);
}
module.exports = { envoyer };
