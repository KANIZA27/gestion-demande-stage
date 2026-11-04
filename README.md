# Plateforme de gestion des demandes de stage

Application web qui permet aux étudiants de **déposer et suivre leurs demandes de stage en ligne** au Conseil Départemental de Mayotte, au lieu d'apporter un dossier papier sur place. Les gestionnaires publient les offres, traitent les candidatures et échangent avec les candidats.

Projet de **Kaniza SAINDOU**, réalisé à partir du cahier des charges de mon stage de développeuse web au Conseil Départemental de Mayotte (2024-2025). Cette version a été recréée en novembre 2026.

> **Version de démonstration** : les personnes, offres et candidatures sont des exemples. Les e-mails ne sont pas envoyés : ils sont écrits dans `logs/emails.log`.

🔗 **Version d'essai en ligne : https://kaniza27.github.io/gestion-demande-stage/**

📄 [Cahier des charges (version corrigée)](docs/cahier-des-charges.md)

## Fonctionnalités

| Pour qui | Ce qu'on peut faire |
| --- | --- |
| **Stagiaire** | Créer un compte (e-mail + mot de passe), modifier son profil (nom, prénom, téléphone, date de naissance, adresse), consulter les offres, candidater avec **CV, lettre de motivation et convention de stage** (PDF), suivre l'état de ses candidatures, recevoir des notifications, écrire aux gestionnaires. |
| **Gestionnaire** | Tableau de bord, liste des candidatures filtrée par statut, fiche détaillée avec les pièces jointes, **validation ou refus** (le candidat est prévenu automatiquement), ajout / modification / suppression des offres, messagerie avec les candidats. |
| **Administrateur** | Tout ce que fait le gestionnaire, plus la gestion des comptes et des **rôles**. |

## Sécurité

- Mots de passe **hachés avec bcrypt**, jamais stockés en clair.
- Sessions sécurisées (cookie `httpOnly`), contrôle des **rôles** sur chaque page.
- Pièces jointes : **PDF uniquement**, 5 Mo maximum, renommées de façon aléatoire ; un stagiaire ne peut ouvrir que ses propres documents.
- Aucun mot de passe dans le code : la configuration passe par des variables d'environnement (voir `.env.example`).

## Base de données

D'après le dictionnaire de données du cahier des charges : `utilisateurs`, `offres_stage`, `demandes_stage`, `messages`, plus une table `notifications`.
- `database/schema.mysql.sql` : schéma **MySQL** (production).
- Sans serveur MySQL, l'application utilise une base **SQLite** locale, pratique pour la démonstration.

## Lancer le projet

Il faut **Node.js 22** ou plus récent.

```bash
npm install
npm start         # http://localhost:3000 (la base de démonstration se crée toute seule)
npm run init-db   # pour remettre les exemples à zéro
```

Comptes de démonstration :

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| Stagiaire | fatima@demo.yt | Stagiaire2026! |
| Gestionnaire | gestion@demo.yt | Gestion2026! |
| Administrateur | admin@demo.yt | Admin2026! |

Pour utiliser MySQL : créer la base avec `database/schema.mysql.sql`, puis renseigner `DB_HOST`, `DB_USER`, `DB_PASSWORD` et `DB_NAME`.

## Mettre en ligne (gratuit, sur Render)

[![Déployer sur Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/KANIZA27/gestion-demande-stage)

1. Cliquer sur le bouton ci-dessus et se connecter avec son compte GitHub.
2. Valider : Render lit le fichier `render.yaml`, installe le projet et le démarre.
3. Au bout de quelques minutes, le site est accessible à une adresse du type `https://gestion-demande-stage.onrender.com`.

La base de démonstration est créée automatiquement au premier démarrage. Sur l'offre gratuite, le site se met en veille après un moment sans visite (le premier chargement prend alors environ une minute) et les données de test sont remises à zéro à chaque redémarrage.

## Tests

```bash
npm test
```
10 tests (Jest + Supertest) : inscription, connexion, droits d'accès, dépôt de candidature avec pièces jointes, refus des fichiers non PDF, validation par le gestionnaire avec notification, protection des documents, publication d'une offre, messagerie.

## Organisation du code

```
app.js / server.js        Application Express et démarrage
config/                   Base de données, envoi des pièces jointes, e-mails
controllers/              Logique de chaque partie (comptes, offres, candidatures, messages, admin)
middlewares/auth.js       Vérification de la connexion et des rôles
routes/index.js           Toutes les adresses du site
views/                    Pages EJS
public/css/               Styles
database/                 Schémas SQL et données de démonstration
tests/                    Tests automatiques
```

## Technologies

Node.js · Express · EJS · MySQL / SQLite · bcrypt · Multer · Jest · Supertest

© 2026 Kaniza SAINDOU
