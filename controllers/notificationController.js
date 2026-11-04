const db = require("../config/db");
module.exports = {
  async list(req, res) {
    const notifs = await db.all("SELECT * FROM notifications WHERE id_utilisateur = ? ORDER BY date_creation DESC, id DESC", [req.session.user.id]);
    await db.run("UPDATE notifications SET lu = 1 WHERE id_utilisateur = ?", [req.session.user.id]);
    res.locals.nbNotifs = 0;
    res.render("notifications", { titre: "Notifications", notifs });
  },
};
