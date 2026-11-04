# Cahier des charges — Plateforme de suivi des demandes de stage

**Projet :** Plateforme de gestion des demandes de stage  
**Auteure :** Kaniza SAINDOU  
**Cadre :** stage de développeuse web au Conseil Départemental de Mayotte  
**Version :** 2.0 (corrigée) — novembre 2026  

---

## 1. Introduction

### 1.1 Contexte
Le Conseil Départemental de Mayotte reçoit chaque année de nombreuses demandes de stage. Aujourd'hui, la gestion de ces demandes est en grande partie manuelle : les candidats déposent un dossier papier sur place, ce qui entraîne des délais de traitement importants et un suivi difficile.

### 1.2 Objectif du projet
Automatiser et simplifier la gestion des demandes de stage grâce à une plateforme en ligne qui permet :

- aux candidats de déposer leur demande et de suivre son avancement sans se déplacer ;
- aux services de publier leurs offres et de traiter les candidatures au même endroit ;
- à l'administration de superviser l'ensemble du processus.

### 1.3 Périmètre
L'application est destinée principalement aux **étudiants** qui souhaitent effectuer un stage au Conseil Départemental de Mayotte, ainsi qu'aux **agents** chargés de traiter leurs demandes.

### 1.4 Public cible et rôles
| Rôle | Qui | Droits |
| --- | --- | --- |
| **Stagiaire** | Étudiant ou candidat | Créer un compte, gérer son profil, consulter les offres, candidater, suivre ses demandes, écrire aux gestionnaires |
| **Gestionnaire** | Agent d'un service du Département | Publier, modifier et supprimer des offres, traiter les candidatures (valider / refuser), répondre aux candidats |
| **Administrateur** | Responsable de la plateforme | Tous les droits du gestionnaire + gestion des comptes et des rôles |

> *Correction v2 : la version 1 citait aussi « entreprises » et « universités ». Les offres étant proposées par les services du Conseil Départemental, ces acteurs sont regroupés sous le rôle **gestionnaire**, ce qui correspond au dictionnaire de données.*

---

## 2. Analyse des besoins

- **Stagiaires** : déposer une demande facilement depuis un téléphone ou un ordinateur, et savoir à tout moment où elle en est.
- **Gestionnaires** : publier les offres, voir toutes les candidatures, consulter les pièces jointes et donner une réponse rapidement.
- **Administrateurs** : superviser le processus et gérer les accès.
- **Interface** : simple, claire, utilisable sur mobile (responsive).

---

## 3. Fonctionnalités

### 3.1 Gestion des utilisateurs

- Création de compte : **identifiant (adresse e-mail)** et **mot de passe** (8 caractères minimum).
- Connexion et déconnexion sécurisées.
- Gestion du profil : nom, prénom, téléphone, date de naissance, adresse.
- Gestion des rôles par l'administrateur.

### 3.2 Dépôt et suivi des demandes
Étapes du dépôt :

1. Création du compte (e-mail, mot de passe) ;
2. Saisie des informations personnelles (nom, prénom, téléphone, date de naissance, adresse) ;
3. Choix d'une offre et import des documents : **CV**, **lettre de motivation** (obligatoires) et **convention de stage** (facultative au dépôt).

Règles :

- Documents au format **PDF uniquement**, **5 Mo maximum** par fichier.
- Une seule candidature par offre et par stagiaire.
- Statuts possibles : **en attente**, **validée**, **refusée**.
- Le stagiaire voit l'état de chacune de ses demandes en temps réel.

### 3.3 Gestion des offres de stage

- Ajout, modification et suppression des offres par les gestionnaires.
- Consultation des offres et candidature par les stagiaires.
- Le nombre de places disponibles diminue automatiquement quand une candidature est validée ; une offre sans place n'accepte plus de candidature.

### 3.4 Notifications et communication

- Notification dans la plateforme **et** e-mail à chaque étape : dépôt de la demande, validation, refus.
- Messagerie interne entre stagiaires et gestionnaires.

---

## 4. Exigences de sécurité

- Mots de passe **hachés avec bcrypt** (jamais stockés en clair).
- Contrôle des rôles sur chaque page.
- Un stagiaire ne peut consulter que ses propres documents et candidatures.
- Fichiers renommés aléatoirement à l'enregistrement.
- Aucun mot de passe ni clé secrète dans le code source : configuration par variables d'environnement.

---

## 5. Technologies

| Partie | Technologie |
| --- | --- |
| Front-end | HTML, CSS, JavaScript, pages **EJS** (responsive) |
| Back-end | **Node.js**, **Express.js** (architecture MVC) |
| Base de données | **MySQL** (SQLite pour la version de démonstration) |
| Authentification | **Sessions** sécurisées + **bcrypt.js** |
| Pièces jointes | Multer |
| Tests | **Jest** et **Supertest** (tests fonctionnels), Postman pour tester les routes |

> *Correction v2 : la v1 prévoyait « JWT ou sessions ». Le choix retenu est la **session**, plus simple et adaptée à un site rendu côté serveur avec EJS. **React.js** n'est pas nécessaire pour cette version : il est prévu en évolution (voir section 9).*

---

## 6. Dictionnaire de données

### 6.1 Table `utilisateurs`
| Champ | Type | Taille | Description |
| --- | --- | --- | --- |
| id | ENTIER, clé primaire, auto-incrémenté | | Identifiant unique de l'utilisateur |
| nom | CHAÎNE | 100 | Nom |
| prenom | CHAÎNE | 100 | Prénom |
| email | CHAÎNE, **unique** | 255 | Adresse e-mail (identifiant de connexion) |
| mot_de_passe | CHAÎNE | 255 | Mot de passe **haché** (bcrypt) |
| role | ÉNUMÉRATION (stagiaire, gestionnaire, admin) | | Rôle de l'utilisateur |
| telephone | CHAÎNE | 20 | Téléphone *(ajouté en v2)* |
| date_naissance | DATE | | Date de naissance *(ajouté en v2)* |
| adresse | CHAÎNE | 255 | Adresse *(ajouté en v2)* |
| date_creation | TIMESTAMP | | Date et heure de création du compte |

### 6.2 Table `offres_stage`
| Champ | Type | Taille | Description |
| --- | --- | --- | --- |
| id | ENTIER, clé primaire, auto-incrémenté | | Identifiant unique de l'offre |
| titre | CHAÎNE | 255 | Titre de l'offre |
| description | TEXTE | | Détails de l'offre |
| departement | CHAÎNE | 100 | Service qui propose le stage |
| date_debut | DATE | | Début prévu |
| date_fin | DATE | | Fin prévue |
| places_disponibles | ENTIER | | Nombre de places encore disponibles |

### 6.3 Table `demandes_stage`
| Champ | Type | Taille | Description |
| --- | --- | --- | --- |
| id | ENTIER, clé primaire, auto-incrémenté | | Identifiant unique de la demande |
| id_utilisateur | ENTIER, clé étrangère → utilisateurs | | Stagiaire |
| id_offre | ENTIER, clé étrangère → offres_stage | | Offre choisie |
| cv | CHAÎNE | 255 | Chemin du fichier CV |
| lettre_motivation | CHAÎNE | 255 | Chemin du fichier lettre de motivation |
| convention | CHAÎNE | 255 | Chemin du fichier convention de stage *(ajouté en v2)* |
| statut | ÉNUMÉRATION (en attente, validée, refusée) | | État de la demande |
| date_soumission | **TIMESTAMP** | | Date et heure de soumission *(type précisé en v2)* |

Contrainte : un couple (id_utilisateur, id_offre) unique.

### 6.4 Table `messages`
| Champ | Type | Description |
| --- | --- | --- |
| id | ENTIER, clé primaire, auto-incrémenté | Identifiant unique du message |
| id_expediteur | ENTIER, clé étrangère → utilisateurs | Expéditeur |
| id_destinataire | ENTIER, clé étrangère → utilisateurs | Destinataire |
| contenu | TEXTE | Contenu du message |
| lu | BOOLÉEN | Message lu ou non *(ajouté en v2)* |
| date_envoi | TIMESTAMP | Date et heure d'envoi |

### 6.5 Table `notifications` *(ajoutée en v2)*
| Champ | Type | Taille | Description |
| --- | --- | --- | --- |
| id | ENTIER, clé primaire, auto-incrémenté | | Identifiant |
| id_utilisateur | ENTIER, clé étrangère → utilisateurs | | Destinataire de la notification |
| message | CHAÎNE | 255 | Texte de la notification |
| lu | BOOLÉEN | | Lue ou non |
| date_creation | TIMESTAMP | | Date de création |

---

## 7. Déroulement du projet

1. **Analyse et conception** : cahier des charges, conception de la base de données, maquettes.
2. **Développement** : back-end Express (MVC), pages EJS, authentification, dépôt des pièces jointes, notifications, messagerie.
3. **Tests et déploiement** : tests fonctionnels automatisés (Jest + Supertest), mise en ligne sur un hébergeur, documentation (README).

## 8. Livrables

- Code source sur GitHub : `KANIZA27/gestion-demande-stage`
- Script de création de la base MySQL (`database/schema.mysql.sql`)
- Documentation d'installation et d'utilisation (`README.md`)
- Tests automatisés (`tests/`)

## 9. Évolutions possibles

- Interface en **React.js** connectée à une API REST (avec JWT).
- Envoi réel des e-mails via un service SMTP.
- Statistiques pour les gestionnaires (nombre de demandes par service, délais de réponse).
- Signature électronique de la convention de stage.

## 10. Durée
Projet réalisé pendant le stage de développeuse web au Conseil Départemental de Mayotte (2024-2025), recréé et complété en novembre 2026.
