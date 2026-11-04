// Crée la base SQLite de démonstration et la remplit avec des exemples.
// Usage : npm run init-db
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

async function init({ reset = true } = {}) {
  const file = process.env.DB_FILE || path.join(__dirname, "gestion_stage.sqlite");
  if (reset && file !== ":memory:" && fs.existsSync(file)) fs.unlinkSync(file);
  const db = require("../config/db");
  db.exec(fs.readFileSync(path.join(__dirname, "schema.sqlite.sql"), "utf8"));

  // Petits PDF d'exemple pour les candidatures de démonstration
  const up = path.join(__dirname, "..", "uploads");
  fs.mkdirSync(up, { recursive: true });
  const pdf = (titre) => {
    const txt = `BT /F1 20 Tf 60 760 Td (${titre}) Tj 0 -30 Td /F1 12 Tf (Document d'exemple - Plateforme de Kaniza SAINDOU) Tj ET`;
    const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
      `<< /Length ${txt.length} >>\nstream\n${txt}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
    let out = "%PDF-1.4\n"; const pos = [];
    objs.forEach((o, i) => { pos.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const x = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + pos.map((p) => String(p).padStart(10, "0") + " 00000 n \n").join("");
    return out + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  };
  if (file !== ":memory:") {
    fs.writeFileSync(path.join(up, "exemple-cv.pdf"), pdf("CV - exemple"));
    fs.writeFileSync(path.join(up, "exemple-lettre.pdf"), pdf("Lettre de motivation - exemple"));
    fs.writeFileSync(path.join(up, "exemple-convention.pdf"), pdf("Convention de stage - exemple"));
  }

  const hash = (p) => bcrypt.hashSync(p, 10);
  const users = [
    ["Admin", "Plateforme", "admin@demo.yt", hash("Admin2026!"), "admin", null, null, null],
    ["MADI", "Zaïnaba", "gestion@demo.yt", hash("Gestion2026!"), "gestionnaire", "0269000000", null, "Mamoudzou"],
    ["ATTOUMANI", "Fatima", "fatima@demo.yt", hash("Stagiaire2026!"), "stagiaire", "0639131415", "2004-03-12", "Kahani, Ouangani"],
    ["SAID", "Ali", "ali@demo.yt", hash("Stagiaire2026!"), "stagiaire", "0639040506", "2002-09-30", "Dembéni"],
    ["ABDOU", "Nadjati", "nadjati@demo.yt", hash("Stagiaire2026!"), "stagiaire", "0639010203", "2006-01-21", "Sada"],
  ];
  for (const u of users) {
    await db.run(
      "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, telephone, date_naissance, adresse) VALUES (?,?,?,?,?,?,?,?)", u);
  }
  // Dates calculées à partir d'aujourd'hui, pour que la démonstration reste valable
  const jour = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const offres = [
    ["Stage en développement web à Mamoudzou", "Développement d'une plateforme web pour un service public : participer à la création et à la maintenance des applications internes du Département (HTML, CSS, JavaScript, Node.js).", "Direction du Numérique (DNSI)", "2027-01-11", "2027-03-26", 2, jour(-23), jour(41)],
    ["Stage RH à Mamoudzou", "Accompagner l'équipe des ressources humaines dans le suivi administratif des dossiers et l'accueil des agents.", "Ressources Humaines", "2027-02-01", "2027-02-26", 1, jour(-16), jour(57)],
    ["Stage en communication à Mamoudzou", "Rédiger des publications, préparer des visuels et couvrir les événements du Département.", "Communication", "2027-01-18", "2027-03-12", 1, jour(-10), jour(46)],
    ["Stage en accompagnement social à Dzaoudzi", "Découvrir l'accompagnement des familles et l'accueil du public au sein d'une circonscription d'action sociale.", "Action sociale", "2027-03-01", "2027-03-26", 3, jour(-2), jour(88)],
  ];
  for (const o of offres) {
    await db.run("INSERT INTO offres_stage (titre, description, departement, date_debut, date_fin, places_disponibles, date_publication, date_limite) VALUES (?,?,?,?,?,?,?,?)", o);
  }
  const demandes = [
    [3, 4, "exemple-cv.pdf", "exemple-lettre.pdf", null, "validée", "2026-10-22 09:14:00", "Je souhaite découvrir le travail social auprès des familles."],
    [4, 1, "exemple-cv.pdf", "exemple-lettre.pdf", "exemple-convention.pdf", "validée", "2026-10-31 10:02:00", null],
    [5, 3, "exemple-cv.pdf", "exemple-lettre.pdf", null, "en attente", "2026-11-03 15:40:00", "Je suis disponible dès janvier."],
    [3, 2, "exemple-cv.pdf", "exemple-lettre.pdf", null, "refusée", "2026-10-25 11:30:00", null],
  ];
  for (const d of demandes) {
    await db.run("INSERT INTO demandes_stage (id_utilisateur, id_offre, cv, lettre_motivation, convention, statut, date_soumission, message) VALUES (?,?,?,?,?,?,?,?)", d);
  }
  await db.run("INSERT INTO notifications (id_utilisateur, message) VALUES (?,?)", [3, "Votre candidature « Stage en accompagnement social à Dzaoudzi » a été validée."]);
  await db.run("INSERT INTO notifications (id_utilisateur, message, lu) VALUES (?,?,1)", [3, "Votre candidature « Stage RH à Mamoudzou » a été refusée."]);
  await db.run("INSERT INTO messages (id_expediteur, id_destinataire, contenu, date_envoi) VALUES (?,?,?,?)", [3, 2, "Bonjour, je voudrais savoir quels documents apporter le premier jour du stage ?", "2026-11-02 08:30:00"]);
  await db.run("INSERT INTO messages (id_expediteur, id_destinataire, contenu, date_envoi) VALUES (?,?,?,?)", [2, 3, "Bonjour Fatima, merci d'apporter une pièce d'identité et votre convention signée. À bientôt !", "2026-11-02 10:05:00"]);
  return db;
}

module.exports = init;
if (require.main === module) init().then(() => console.log("Base de démonstration créée."));
