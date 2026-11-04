const db = require("../config/db");
const ROLES = ["stagiaire", "gestionnaire", "admin"];

module.exports = {
  async users(req, res) {
    const users = await db.all("SELECT id, nom, prenom, email, role, date_creation FROM utilisateurs ORDER BY role, nom");
    res.render("admin/utilisateurs", { titre: "Utilisateurs", users, ROLES });
  },
  async setRole(req, res) {
    const role = req.body.role;
    if (!ROLES.includes(role)) return res.sendStatus(400);
    if (Number(req.params.id) === req.session.user.id) {
      req.session.flash = "Vous ne pouvez pas modifier votre propre rôle.";
      return res.redirect("/admin/utilisateurs");
    }
    await db.run("UPDATE utilisateurs SET role = ? WHERE id = ?", [role, req.params.id]);
    req.session.flash = "Le rôle a été mis à jour.";
    res.redirect("/admin/utilisateurs");
  },
};
