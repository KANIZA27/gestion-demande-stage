const db = require("../config/db");

module.exports = {
  async show(req, res) {
    const u = await db.get("SELECT id, nom, prenom, email, role, telephone, date_naissance, adresse, date_creation FROM utilisateurs WHERE id = ?", [req.session.user.id]);
    res.render("profil", { titre: "Mon profil", u, ok: null, erreur: null });
  },
  async update(req, res) {
    const { nom, prenom, telephone, date_naissance, adresse } = req.body;
    if (!nom || !prenom) {
      const u = await db.get("SELECT * FROM utilisateurs WHERE id = ?", [req.session.user.id]);
      return res.status(400).render("profil", { titre: "Mon profil", u, ok: null, erreur: "Le nom et le prénom sont obligatoires." });
    }
    await db.run("UPDATE utilisateurs SET nom = ?, prenom = ?, telephone = ?, date_naissance = ?, adresse = ? WHERE id = ?",
      [nom.trim(), prenom.trim(), telephone || null, date_naissance || null, adresse || null, req.session.user.id]);
    req.session.user.nom = nom.trim(); req.session.user.prenom = prenom.trim();
    const u = await db.get("SELECT * FROM utilisateurs WHERE id = ?", [req.session.user.id]);
    res.render("profil", { titre: "Mon profil", u, ok: "Vos informations ont été mises à jour.", erreur: null });
  },
};
