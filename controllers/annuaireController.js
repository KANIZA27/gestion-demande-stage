const db = require("../config/db");

// Rubriques « Candidats », « Agents » et « Documents »
module.exports = {
  async candidats(req, res) {
    const candidats = await db.all(`SELECT u.id, u.nom, u.prenom, u.email, u.telephone, u.adresse, u.date_creation,
        (SELECT COUNT(*) FROM demandes_stage d WHERE d.id_utilisateur = u.id) AS nb,
        (SELECT COUNT(*) FROM demandes_stage d WHERE d.id_utilisateur = u.id AND d.statut = 'validée') AS nb_ok
      FROM utilisateurs u WHERE u.role = 'stagiaire' ORDER BY u.nom, u.prenom`);
    res.render("annuaire/candidats", { titre: "Candidats", candidats });
  },

  async agents(req, res) {
    const agents = await db.all(`SELECT id, nom, prenom, email, telephone, role, date_creation
      FROM utilisateurs WHERE role IN ('gestionnaire', 'admin') ORDER BY role DESC, nom`);
    res.render("annuaire/agents", { titre: "Agents", agents });
  },

  async documents(req, res) {
    const u = req.session.user;
    let sql = `SELECT d.id, d.cv, d.lettre_motivation, d.convention, d.date_soumission, d.statut,
        u.nom, u.prenom, o.titre
      FROM demandes_stage d JOIN utilisateurs u ON u.id = d.id_utilisateur JOIN offres_stage o ON o.id = d.id_offre`;
    const params = [];
    if (u.role === "stagiaire") { sql += " WHERE d.id_utilisateur = ?"; params.push(u.id); }
    sql += " ORDER BY d.date_soumission DESC";
    res.render("annuaire/documents", { titre: "Documents", demandes: await db.all(sql, params) });
  },
};
