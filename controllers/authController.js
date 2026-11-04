const bcrypt = require("bcryptjs");
const db = require("../config/db");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = {
  showLogin(req, res) {
    res.render("auth/connexion", { titre: "Connexion", erreur: null, email: "" });
  },

  async login(req, res) {
    const email = (req.body.email || "").trim().toLowerCase();
    const mdp = req.body.mot_de_passe || "";
    const u = await db.get("SELECT * FROM utilisateurs WHERE email = ?", [email]);
    // Même message dans les deux cas : on ne révèle pas si l'e-mail existe.
    if (!u || !bcrypt.compareSync(mdp, u.mot_de_passe)) {
      return res.status(401).render("auth/connexion", { titre: "Connexion", erreur: "E-mail ou mot de passe incorrect.", email });
    }
    const retour = typeof req.session.retour === "string" && req.session.retour.startsWith("/") && !req.session.retour.startsWith("//") ? req.session.retour : null;
    req.session.regenerate(() => {
      req.session.user = { id: u.id, nom: u.nom, prenom: u.prenom, email: u.email, role: u.role };
      res.redirect(retour || (u.role === "stagiaire" ? "/mes-candidatures" : "/gestion"));
    });
  },

  showRegister(req, res) {
    res.render("auth/inscription", { titre: "Créer un compte", erreur: null, valeurs: {} });
  },

  async register(req, res) {
    const v = {
      nom: (req.body.nom || "").trim(), prenom: (req.body.prenom || "").trim(),
      email: (req.body.email || "").trim().toLowerCase(), telephone: (req.body.telephone || "").trim(),
      date_naissance: req.body.date_naissance || null, adresse: (req.body.adresse || "").trim(),
    };
    const mdp = req.body.mot_de_passe || "", mdp2 = req.body.confirmation || "";
    let erreur = null;
    if (!v.nom || !v.prenom || !v.email || !mdp) erreur = "Merci de remplir tous les champs obligatoires.";
    else if (!EMAIL_RE.test(v.email)) erreur = "L'adresse e-mail n'est pas valide.";
    else if (mdp.length < 8) erreur = "Le mot de passe doit contenir au moins 8 caractères.";
    else if (mdp !== mdp2) erreur = "Les deux mots de passe ne sont pas identiques.";
    else if (await db.get("SELECT id FROM utilisateurs WHERE email = ?", [v.email])) erreur = "Un compte existe déjà avec cette adresse e-mail.";
    if (erreur) return res.status(400).render("auth/inscription", { titre: "Créer un compte", erreur, valeurs: v });

    const hash = bcrypt.hashSync(mdp, 10);
    // Toute inscription publique crée un compte « stagiaire ». Seul l'admin peut donner un autre rôle.
    const r = await db.run(
      "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, telephone, date_naissance, adresse) VALUES (?,?,?,?, 'stagiaire', ?,?,?)",
      [v.nom, v.prenom, v.email, hash, v.telephone || null, v.date_naissance || null, v.adresse || null]);
    req.session.regenerate(() => {
      req.session.user = { id: r.id, nom: v.nom, prenom: v.prenom, email: v.email, role: "stagiaire" };
      req.session.flash = "Bienvenue ! Votre compte a bien été créé.";
      res.redirect("/offres");
    });
  },

  logout(req, res) {
    req.session.destroy(() => res.redirect("/"));
  },
};
