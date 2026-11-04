const db = require("../config/db");

module.exports = {
  // Liste des conversations
  async index(req, res) {
    const moi = req.session.user;
    // Contacts possibles : un stagiaire écrit aux gestionnaires ; un gestionnaire voit tous ses correspondants.
    const contacts = moi.role === "stagiaire"
      ? await db.all("SELECT id, nom, prenom, role FROM utilisateurs WHERE role = 'gestionnaire' ORDER BY nom")
      : await db.all(`SELECT DISTINCT u.id, u.nom, u.prenom, u.role FROM utilisateurs u JOIN messages m
          ON (m.id_expediteur = u.id AND m.id_destinataire = ?) OR (m.id_destinataire = u.id AND m.id_expediteur = ?)
          ORDER BY u.nom`, [moi.id, moi.id]);
    for (const c of contacts) {
      c.non_lus = (await db.get("SELECT COUNT(*) AS n FROM messages WHERE id_expediteur = ? AND id_destinataire = ? AND lu = 0", [c.id, moi.id])).n;
      const dernier = await db.get(`SELECT contenu, date_envoi FROM messages WHERE (id_expediteur = ? AND id_destinataire = ?) OR (id_expediteur = ? AND id_destinataire = ?)
        ORDER BY date_envoi DESC, id DESC LIMIT 1`, [c.id, moi.id, moi.id, c.id]);
      c.dernier = dernier ? dernier.contenu : null;
    }
    res.render("messages/index", { titre: "Messagerie", contacts });
  },

  async conversation(req, res) {
    const moi = req.session.user;
    const autre = await db.get("SELECT id, nom, prenom, role FROM utilisateurs WHERE id = ?", [req.params.id]);
    if (!autre || autre.id === moi.id) return res.status(404).render("erreur", { titre: "Introuvable", message: "Ce correspondant n'existe pas." });
    // Un stagiaire ne peut écrire qu'aux gestionnaires.
    if (moi.role === "stagiaire" && autre.role === "stagiaire") return res.status(403).render("erreur", { titre: "Accès refusé", message: "Vous pouvez seulement écrire aux gestionnaires." });
    await db.run("UPDATE messages SET lu = 1 WHERE id_expediteur = ? AND id_destinataire = ?", [autre.id, moi.id]);
    res.locals.nbMessages = (await db.get("SELECT COUNT(*) AS n FROM messages WHERE id_destinataire = ? AND lu = 0", [moi.id])).n;
    const messages = await db.all(`SELECT * FROM messages WHERE (id_expediteur = ? AND id_destinataire = ?) OR (id_expediteur = ? AND id_destinataire = ?)
      ORDER BY date_envoi, id`, [moi.id, autre.id, autre.id, moi.id]);
    res.render("messages/conversation", { titre: "Conversation", autre, messages });
  },

  async send(req, res) {
    const moi = req.session.user;
    const contenu = (req.body.contenu || "").trim();
    const autre = await db.get("SELECT id, role FROM utilisateurs WHERE id = ?", [req.params.id]);
    if (!autre || (moi.role === "stagiaire" && autre.role === "stagiaire")) return res.sendStatus(403);
    if (contenu) {
      await db.run("INSERT INTO messages (id_expediteur, id_destinataire, contenu) VALUES (?,?,?)", [moi.id, autre.id, contenu.slice(0, 2000)]);
    }
    res.redirect("/messages/" + autre.id);
  },
};
