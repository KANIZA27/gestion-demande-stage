const db = require("../config/db");

module.exports = {
  async home(req, res) {
    const offres = await db.all("SELECT * FROM offres_stage ORDER BY date_publication DESC, id DESC LIMIT 6");
    res.render("accueil", { titre: "Accueil", offres });
  },

  async list(req, res) {
    const service = req.query.service || "";
    const params = [];
    let sql = "SELECT * FROM offres_stage";
    if (service) { sql += " WHERE departement = ?"; params.push(service); }
    sql += " ORDER BY date_publication DESC, id DESC";
    const offres = await db.all(sql, params);
    const services = (await db.all("SELECT DISTINCT departement FROM offres_stage ORDER BY departement")).map((r) => r.departement);
    res.render("offres/liste", { titre: "Offres de stage", offres, services, service });
  },

  async detail(req, res) {
    const o = await db.get("SELECT * FROM offres_stage WHERE id = ?", [req.params.id]);
    if (!o) return res.status(404).render("erreur", { titre: "Introuvable", message: "Cette offre n'existe pas." });
    let dejaCandidat = false;
    if (req.session.user && req.session.user.role === "stagiaire") {
      dejaCandidat = !!(await db.get("SELECT id FROM demandes_stage WHERE id_utilisateur = ? AND id_offre = ?", [req.session.user.id, o.id]));
    }
    res.render("offres/detail", { titre: o.titre, o, dejaCandidat });
  },

  showForm: async (req, res) => {
    const o = req.params.id ? await db.get("SELECT * FROM offres_stage WHERE id = ?", [req.params.id]) : {};
    res.render("offres/form", { titre: o.id ? "Modifier l'offre" : "Nouvelle offre", o, erreur: null });
  },

  async save(req, res) {
    const { titre, description, departement, date_debut, date_fin, date_limite } = req.body;
    const places = parseInt(req.body.places_disponibles, 10);
    const o = { id: req.params.id, titre, description, departement, date_debut, date_fin, date_limite, places_disponibles: req.body.places_disponibles };
    if (!titre || !departement || Number.isNaN(places) || places < 0) {
      return res.status(400).render("offres/form", { titre: "Offre", o, erreur: "Le titre, le service et un nombre de places valide sont obligatoires." });
    }
    if (date_debut && date_fin && date_fin < date_debut) {
      return res.status(400).render("offres/form", { titre: "Offre", o, erreur: "La date de fin doit être après la date de début." });
    }
    const vals = [titre.trim(), description || "", departement.trim(), date_debut || null, date_fin || null, places, date_limite || null];
    if (req.params.id) {
      await db.run("UPDATE offres_stage SET titre=?, description=?, departement=?, date_debut=?, date_fin=?, places_disponibles=?, date_limite=? WHERE id=?", [...vals, req.params.id]);
      req.session.flash = "L'offre a été modifiée.";
    } else {
      const aujourdhui = new Date().toISOString().slice(0, 10);
      await db.run("INSERT INTO offres_stage (titre, description, departement, date_debut, date_fin, places_disponibles, date_limite, date_publication) VALUES (?,?,?,?,?,?,?,?)", [...vals, aujourdhui]);
      req.session.flash = "L'offre a été publiée.";
    }
    res.redirect("/gestion/offres");
  },

  async remove(req, res) {
    await db.run("DELETE FROM offres_stage WHERE id = ?", [req.params.id]);
    req.session.flash = "L'offre a été supprimée.";
    res.redirect("/gestion/offres");
  },

  async manage(req, res) {
    const offres = await db.all(`SELECT o.*, (SELECT COUNT(*) FROM demandes_stage d WHERE d.id_offre = o.id) AS nb_candidatures
                                 FROM offres_stage o ORDER BY o.date_publication DESC, o.id DESC`);
    res.render("gestion/offres", { titre: "Gérer les offres", offres });
  },
};
