-- Même schéma, version SQLite (démonstration sans serveur MySQL)
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL, prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE, mot_de_passe TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'stagiaire' CHECK (role IN ('stagiaire','gestionnaire','admin')),
  telephone TEXT, date_naissance TEXT, adresse TEXT,
  date_creation TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS offres_stage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titre TEXT NOT NULL, description TEXT, departement TEXT NOT NULL,
  date_debut TEXT, date_fin TEXT, places_disponibles INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS demandes_stage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_utilisateur INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  id_offre INTEGER NOT NULL REFERENCES offres_stage(id) ON DELETE CASCADE,
  cv TEXT NOT NULL, lettre_motivation TEXT NOT NULL, convention TEXT,
  statut TEXT NOT NULL DEFAULT 'en attente' CHECK (statut IN ('en attente','validée','refusée')),
  date_soumission TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_utilisateur, id_offre)
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_expediteur INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  id_destinataire INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL, lu INTEGER NOT NULL DEFAULT 0,
  date_envoi TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_utilisateur INTEGER NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  message TEXT NOT NULL, lu INTEGER NOT NULL DEFAULT 0,
  date_creation TEXT DEFAULT CURRENT_TIMESTAMP
);
