const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 3000;

async function demarrer() {
  // Sans MySQL : crée la base de démonstration au premier lancement
  const fichier = process.env.DB_FILE || path.join(__dirname, "database", "gestion_stage.sqlite");
  if (!process.env.DB_HOST && !fs.existsSync(fichier)) {
    await require("./database/init")();
    console.log("Base de démonstration créée.");
  }
  const app = require("./app");
  app.listen(PORT, () => console.log(`Plateforme de gestion des stages : http://localhost:${PORT}`));
}
demarrer();
