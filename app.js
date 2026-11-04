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

// Petites icônes du menu (SVG intégré, aucune ressource externe)
const ICONES = {
  accueil: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  offres: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  candidats: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 5.8"/>',
  candidatures: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
  agents: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  documents: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  connexion: '<path d="M10 17l5-5-5-5M15 12H3M14 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6"/>',
  inscription: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
  messages: '<path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1z"/>',
  notifications: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  profil: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5a6 6 0 0 1 11 0"/>',
  deconnexion: '<path d="M14 7l5 5-5 5M19 12H8M10 21H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"/>',
  tableau: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
};
app.locals.icone = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n] || ""}</svg>`;
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
