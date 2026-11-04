const express = require("express");
const router = express.Router();
const { connecte, role } = require("../middlewares/auth");
const { upload } = require("../config/upload");
const auth = require("../controllers/authController");
const profil = require("../controllers/profilController");
const offre = require("../controllers/offreController");
const cand = require("../controllers/candidatureController");
const msg = require("../controllers/messageController");
const admin = require("../controllers/adminController");
const notif = require("../controllers/notificationController");
const annuaire = require("../controllers/annuaireController");

// Petite aide : transmet les erreurs des fonctions async à Express
const a = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Envoi des pièces jointes : on récupère l'erreur (mauvais format, trop gros) pour l'afficher proprement
const pieces = (req, res, next) =>
  upload.fields([{ name: "cv", maxCount: 1 }, { name: "lettre_motivation", maxCount: 1 }, { name: "convention", maxCount: 1 }])(req, res, (err) => {
    if (err) req.uploadErreur = err.code === "LIMIT_FILE_SIZE" ? "Chaque fichier doit faire moins de 5 Mo." : err.message;
    next();
  });

// Pages publiques
router.get("/", a(offre.home));
router.get("/connexion", auth.showLogin);
router.post("/connexion", a(auth.login));
router.get("/inscription", auth.showRegister);
router.post("/inscription", a(auth.register));
router.post("/deconnexion", auth.logout);
router.get("/offres", a(offre.list));
router.get("/offres/:id", a(offre.detail));

// Utilisateur connecté
router.get("/profil", connecte, a(profil.show));
router.post("/profil", connecte, a(profil.update));
router.get("/notifications", connecte, a(notif.list));
router.get("/messages", connecte, a(msg.index));
router.get("/messages/:id", connecte, a(msg.conversation));
router.post("/messages/:id", connecte, a(msg.send));
router.get("/candidatures/:id/fichier/:champ", connecte, a(cand.fichier));
router.get("/documents", connecte, a(annuaire.documents));

// Stagiaire
router.get("/offres/:id/candidater", role("stagiaire"), a(cand.showForm));
router.post("/offres/:id/candidater", role("stagiaire"), pieces, a(cand.create));
router.get("/mes-candidatures", role("stagiaire"), a(cand.mine));

// Gestionnaire et admin
const gestion = role("gestionnaire", "admin");
router.get("/gestion", gestion, a(cand.dashboard));
router.get("/candidats", gestion, a(annuaire.candidats));
router.get("/agents", gestion, a(annuaire.agents));
router.get("/gestion/candidatures", gestion, a(cand.list));
router.get("/gestion/candidatures/:id", gestion, a(cand.detail));
router.post("/gestion/candidatures/:id/statut", gestion, a(cand.changeStatut));
router.get("/gestion/offres", gestion, a(offre.manage));
router.get("/gestion/offres/nouvelle", gestion, a(offre.showForm));
router.post("/gestion/offres/nouvelle", gestion, a(offre.save));
router.get("/gestion/offres/:id/modifier", gestion, a(offre.showForm));
router.post("/gestion/offres/:id/modifier", gestion, a(offre.save));
router.post("/gestion/offres/:id/supprimer", gestion, a(offre.remove));

// Admin
router.get("/admin/utilisateurs", role("admin"), a(admin.users));
router.post("/admin/utilisateurs/:id/role", role("admin"), a(admin.setRole));

module.exports = router;
