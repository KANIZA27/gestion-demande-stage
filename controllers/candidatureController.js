const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const mailer = require("../config/mailer");
const { DOSSIER } = require("../config/upload");

const STATUTS = ["en attente", "validée", "refusée"];

async function notifier(idUtilisateur, message) {
  await db.run("INSERT INTO notifications (id_utilisateur, message) VALUES (?, ?)", [idUtilisateur, message]);
  const u = await db.get("SELECT email, prenom FROM utilisateurs WHERE id = ?", [idUtilisateur]);
  if (u) mailer.envoyer(u.email, "Suivi de votre demande de stage", `Bonjour ${u.prenom},\n\n${message}\n\nPlateforme de gestion des demandes de stage`);
}

function supprimerFichiers(files) {
  for (const f of Object.values(files || {}).flat()) fs.unlink(f.path, () => {});
}

module.exports = {
  STATUTS,

  async showForm(req, res) {
    const o = await db.get("SELECT * FROM offres_stage WHERE id = ?", [req.params.id]);
    if (!o) return res.status(404).render("erreur", { titre: "Introuvable", message: "Cette offre n'existe pas." });
    res.render("candidatures/form", { titre: "Candidater", o, erreur: null });
  },

  async create(req, res) {
    const o = await db.get("SELECT * FROM offres_stage WHERE id = ?", [req.params.id]);
    if (!o) { supprimerFichiers(req.files); return res.status(404).render("erreur", { titre: "Introuvable", message: "Cette offre n'existe pas." }); }
    const f = req.files || {};
    let erreur = req.uploadErreur || null;
    if (!erreur && (!f.cv || !f.lettre_motivation)) erreur = "Le CV et la lettre de motivation sont obligatoires (format PDF).";
    if (!erreur && o.places_disponibles <= 0) erreur = "Il n'y a plus de place disponible pour cette offre.";
    if (!erreur && o.date_limite && o.date_limite < new Date().toISOString().slice(0, 10)) erreur = "La date limite pour postuler à cette offre est dépassée.";
    if (!erreur && await db.get("SELECT id FROM demandes_stage WHERE id_utilisateur = ? AND id_offre = ?", [req.session.user.id, o.id])) {
      erreur = "Vous avez déjà candidaté à cette offre.";
    }
    if (erreur) { supprimerFichiers(f); return res.status(400).render("candidatures/form", { titre: "Candidater", o, erreur }); }

    const message = (req.body.message || "").trim().slice(0, 2000) || null;
    await db.run("INSERT INTO demandes_stage (id_utilisateur, id_offre, cv, lettre_motivation, convention, message) VALUES (?,?,?,?,?,?)",
      [req.session.user.id, o.id, f.cv[0].filename, f.lettre_motivation[0].filename, f.convention ? f.convention[0].filename : null, message]);
    await notifier(req.session.user.id, `Votre candidature « ${o.titre} » a bien été reçue. Elle est en attente de traitement.`);
    req.session.flash = "Votre candidature a bien été envoyée. Vous pouvez suivre son avancement ici.";
    res.redirect("/mes-candidatures");
  },

  async mine(req, res) {
    const demandes = await db.all(`SELECT d.*, o.titre, o.departement, o.date_debut, o.date_fin
      FROM demandes_stage d JOIN offres_stage o ON o.id = d.id_offre
      WHERE d.id_utilisateur = ? ORDER BY d.date_soumission DESC`, [req.session.user.id]);
    res.render("candidatures/mes", { titre: "Mes candidatures", demandes });
  },

  async dashboard(req, res) {
    const compte = async (sql, p = []) => (await db.get(sql, p)).n;
    const stats = {
      total: await compte("SELECT COUNT(*) AS n FROM demandes_stage"),
      attente: await compte("SELECT COUNT(*) AS n FROM demandes_stage WHERE statut = 'en attente'"),
      validees: await compte("SELECT COUNT(*) AS n FROM demandes_stage WHERE statut = 'validée'"),
      offres: await compte("SELECT COUNT(*) AS n FROM offres_stage"),
    };
    const recentes = await db.all(`SELECT d.id, d.statut, d.date_soumission, u.nom, u.prenom, o.titre
      FROM demandes_stage d JOIN utilisateurs u ON u.id = d.id_utilisateur JOIN offres_stage o ON o.id = d.id_offre
      ORDER BY d.date_soumission DESC LIMIT 5`);
    res.render("gestion/tableau", { titre: "Tableau de bord", stats, recentes });
  },

  async list(req, res) {
    const statut = STATUTS.includes(req.query.statut) ? req.query.statut : "";
    const params = [];
    let sql = `SELECT d.*, u.nom, u.prenom, u.email, o.titre, o.departement
      FROM demandes_stage d JOIN utilisateurs u ON u.id = d.id_utilisateur JOIN offres_stage o ON o.id = d.id_offre`;
    if (statut) { sql += " WHERE d.statut = ?"; params.push(statut); }
    sql += " ORDER BY d.date_soumission DESC";
    res.render("gestion/candidatures", { titre: "Candidatures", demandes: await db.all(sql, params), statut, STATUTS });
  },

  async detail(req, res) {
    const d = await db.get(`SELECT d.*, u.nom, u.prenom, u.email, u.telephone, u.date_naissance, u.adresse, o.titre, o.departement, o.places_disponibles
      FROM demandes_stage d JOIN utilisateurs u ON u.id = d.id_utilisateur JOIN offres_stage o ON o.id = d.id_offre WHERE d.id = ?`, [req.params.id]);
    if (!d) return res.status(404).render("erreur", { titre: "Introuvable", message: "Cette candidature n'existe pas." });
    res.render("gestion/candidature", { titre: "Candidature", d, STATUTS });
  },

  async changeStatut(req, res) {
    const statut = req.body.statut;
    if (!STATUTS.includes(statut)) return res.status(400).render("erreur", { titre: "Erreur", message: "Statut invalide." });
    const d = await db.get("SELECT d.*, o.titre, o.places_disponibles FROM demandes_stage d JOIN offres_stage o ON o.id = d.id_offre WHERE d.id = ?", [req.params.id]);
    if (!d) return res.status(404).render("erreur", { titre: "Introuvable", message: "Cette candidature n'existe pas." });
    if (statut === d.statut) return res.redirect("/gestion/candidatures/" + d.id);

    // Une place est occupée quand la candidature est validée, et libérée si on revient en arrière.
    if (statut === "validée") {
      if (d.places_disponibles <= 0) {
        req.session.flash = "Impossible de valider : il n'y a plus de place sur cette offre.";
        return res.redirect("/gestion/candidatures/" + d.id);
      }
      await db.run("UPDATE offres_stage SET places_disponibles = places_disponibles - 1 WHERE id = ?", [d.id_offre]);
    } else if (d.statut === "validée") {
      await db.run("UPDATE offres_stage SET places_disponibles = places_disponibles + 1 WHERE id = ?", [d.id_offre]);
    }
    await db.run("UPDATE demandes_stage SET statut = ? WHERE id = ?", [statut, d.id]);
    await notifier(d.id_utilisateur, `Votre candidature « ${d.titre} » est maintenant : ${statut}.`);
    req.session.flash = `La candidature est maintenant « ${statut} ». Le candidat a été prévenu.`;
    res.redirect("/gestion/candidatures/" + d.id);
  },

  // Téléchargement d'une pièce jointe : seulement par son propriétaire ou par un gestionnaire / admin.
  async fichier(req, res) {
    const champ = req.params.champ;
    if (!["cv", "lettre_motivation", "convention"].includes(champ)) return res.sendStatus(404);
    const d = await db.get("SELECT * FROM demandes_stage WHERE id = ?", [req.params.id]);
    const u = req.session.user;
    if (!d || !d[champ]) return res.sendStatus(404);
    if (u.role === "stagiaire" && d.id_utilisateur !== u.id) return res.sendStatus(403);
    const chemin = path.join(DOSSIER, path.basename(d[champ]));
    if (!fs.existsSync(chemin)) return res.status(404).render("erreur", { titre: "Fichier absent", message: "Ce fichier d'exemple n'existe pas dans la version de démonstration." });
    res.download(chemin, `${champ}-${d.id}.pdf`);
  },
};
