const express = require("express");
const session = require("express-session");
const path = require("path");
const crypto = require("crypto");
const db = require("./config/db");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Aides pour l'affichage des dates et des statuts
app.locals.date = (v) => {
  if (!v) return "";
  const d = new Date(String(v).replace(" ", "T"));
  return isNaN(d) ? String(v) : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};
app.locals.badge = (s) => {
  const c = { "en attente": "att", "validée": "ok", "refusée": "no" }[s] || "att";
  return `<span class="badge ${c}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
};
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 2 },
}));

// Variables disponibles dans toutes les vues : utilisateur connecté, message flash, compteurs
app.use(async (req, res, next) => {
  try {
    res.locals.user = req.session.user || null;
    res.locals.flash = req.session.flash || null;
    res.locals.chemin = req.path;
    delete req.session.flash;
    res.locals.nbNotifs = 0; res.locals.nbMessages = 0;
    if (req.session.user) {
      res.locals.nbNotifs = (await db.get("SELECT COUNT(*) AS n FROM notifications WHERE id_utilisateur = ? AND lu = 0", [req.session.user.id])).n;
      res.locals.nbMessages = (await db.get("SELECT COUNT(*) AS n FROM messages WHERE id_destinataire = ? AND lu = 0", [req.session.user.id])).n;
    }
    next();
  } catch (e) { next(e); }
});

app.use(require("./routes"));

app.use((req, res) => res.status(404).render("erreur", { titre: "Page introuvable", message: "La page demandée n'existe pas." }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render("erreur", { titre: "Erreur", message: "Une erreur est survenue. Merci de réessayer." });
});

module.exports = app;
