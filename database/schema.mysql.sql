-- Plateforme de gestion des demandes de stage — schéma MySQL
-- D'après le dictionnaire de données du cahier des charges.
CREATE DATABASE IF NOT EXISTS gestion_stage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_stage;

CREATE TABLE utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,          -- haché avec bcrypt
  role ENUM('stagiaire','gestionnaire','admin') NOT NULL DEFAULT 'stagiaire',
  telephone VARCHAR(20),
  date_naissance DATE,
  adresse VARCHAR(255),
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE offres_stage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  departement VARCHAR(100) NOT NULL,
  date_debut DATE,
  date_fin DATE,
  places_disponibles INT NOT NULL DEFAULT 1,
  date_publication DATE DEFAULT (CURRENT_DATE),
  date_limite DATE
);

CREATE TABLE demandes_stage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_offre INT NOT NULL,
  cv VARCHAR(255) NOT NULL,
  lettre_motivation VARCHAR(255) NOT NULL,
  convention VARCHAR(255),
  message TEXT,
  statut ENUM('en attente','validée','refusée') NOT NULL DEFAULT 'en attente',
  date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (id_utilisateur, id_offre),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (id_offre) REFERENCES offres_stage(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_expediteur INT NOT NULL,
  id_destinataire INT NOT NULL,
  contenu TEXT NOT NULL,
  lu TINYINT(1) NOT NULL DEFAULT 0,
  date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_expediteur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (id_destinataire) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Notifications (suivi des candidatures)
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  lu TINYINT(1) NOT NULL DEFAULT 0,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE
);
