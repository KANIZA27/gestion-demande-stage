// Gestion des pièces jointes (CV, lettre de motivation, convention de stage).
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const DOSSIER = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

const stockage = multer.diskStorage({
  destination: DOSSIER,
  // Nom de fichier aléatoire : on ne garde jamais le nom envoyé par l'utilisateur.
  filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString("hex") + ".pdf"),
});

const upload = multer({
  storage: stockage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo maximum par fichier
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" && path.extname(file.originalname).toLowerCase() === ".pdf") return cb(null, true);
    cb(new Error("Seuls les fichiers PDF sont acceptés."));
  },
});

module.exports = { upload, DOSSIER };
