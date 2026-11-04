// Tests fonctionnels de la plateforme (Jest + Supertest), sur une base en mémoire.
const os = require("os");
const fs = require("fs");
const path = require("path");
process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "uploads-"));

const request = require("supertest");
const init = require("../database/init");
let app;

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");

async function connexion(email, mdp) {
  const agent = request.agent(app);
  await agent.post("/connexion").type("form").send({ email, mot_de_passe: mdp });
  return agent;
}

beforeAll(async () => {
  await init({ reset: false });
  app = require("../app");
});

describe("Comptes et connexion", () => {
  test("inscription d'un nouveau stagiaire", async () => {
    const res = await request(app).post("/inscription").type("form").send({
      nom: "TEST", prenom: "Kaniza", email: "kaniza@test.yt", mot_de_passe: "MotDePasse1", confirmation: "MotDePasse1",
    });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/offres");
  });

  test("refuse un e-mail déjà utilisé", async () => {
    const res = await request(app).post("/inscription").type("form").send({
      nom: "X", prenom: "Y", email: "fatima@demo.yt", mot_de_passe: "MotDePasse1", confirmation: "MotDePasse1",
    });
    expect(res.status).toBe(400);
    expect(res.text).toContain("existe déjà");
  });

  test("refuse un mauvais mot de passe", async () => {
    const res = await request(app).post("/connexion").type("form").send({ email: "fatima@demo.yt", mot_de_passe: "faux" });
    expect(res.status).toBe(401);
  });

  test("un stagiaire n'a pas accès à l'espace gestionnaire", async () => {
    const agent = await connexion("fatima@demo.yt", "Stagiaire2026!");
    const res = await agent.get("/gestion");
    expect(res.status).toBe(403);
  });
});

describe("Candidatures et suivi", () => {
  test("un stagiaire dépose une candidature avec ses pièces jointes", async () => {
    const agent = await connexion("nadjati@demo.yt", "Stagiaire2026!");
    const res = await agent.post("/offres/1/candidater")
      .field("message", "Je suis motivée par le développement web.")
      .attach("cv", PDF, "cv.pdf").attach("lettre_motivation", PDF, "lettre.pdf");
    expect(res.status).toBe(302);
    const suivi = await agent.get("/mes-candidatures");
    expect(suivi.text).toContain("Stage en développement web à Mamoudzou");
    expect(suivi.text).toContain("En attente");
    // Le gestionnaire voit le message du candidat
    const db = require("../config/db");
    const d = await db.get("SELECT d.id FROM demandes_stage d JOIN utilisateurs u ON u.id = d.id_utilisateur WHERE u.email = 'nadjati@demo.yt' AND d.id_offre = 1");
    const gest = await connexion("gestion@demo.yt", "Gestion2026!");
    expect((await gest.get(`/gestion/candidatures/${d.id}`)).text).toContain("Je suis motivée par le développement web.");
  });

  test("refuse une candidature après la date limite", async () => {
    const db = require("../config/db");
    await db.run("UPDATE offres_stage SET date_limite = '2020-01-01' WHERE id = 2");
    const agent = await connexion("ali@demo.yt", "Stagiaire2026!");
    const res = await agent.post("/offres/2/candidater").attach("cv", PDF, "cv.pdf").attach("lettre_motivation", PDF, "lettre.pdf");
    expect(res.status).toBe(400);
    expect(res.text).toContain("date limite");
  });

  test("refuse un fichier qui n'est pas un PDF", async () => {
    const agent = await connexion("ali@demo.yt", "Stagiaire2026!");
    const res = await agent.post("/offres/3/candidater")
      .attach("cv", Buffer.from("bonjour"), "cv.txt").attach("lettre_motivation", PDF, "lettre.pdf");
    expect(res.status).toBe(400);
    expect(res.text).toContain("PDF");
  });

  test("le gestionnaire valide : le candidat est notifié et une place est occupée", async () => {
    const db = require("../config/db");
    const avant = (await db.get("SELECT places_disponibles AS p FROM offres_stage WHERE id = 1")).p;
    const d = await db.get("SELECT d.id FROM demandes_stage d JOIN utilisateurs u ON u.id = d.id_utilisateur WHERE u.email = 'nadjati@demo.yt' AND d.id_offre = 1");
    const gest = await connexion("gestion@demo.yt", "Gestion2026!");
    await gest.post(`/gestion/candidatures/${d.id}/statut`).type("form").send({ statut: "validée" });
    expect((await db.get("SELECT statut FROM demandes_stage WHERE id = ?", [d.id])).statut).toBe("validée");
    expect((await db.get("SELECT places_disponibles AS p FROM offres_stage WHERE id = 1")).p).toBe(avant - 1);
    const stagiaire = await connexion("nadjati@demo.yt", "Stagiaire2026!");
    const notifs = await stagiaire.get("/notifications");
    expect(notifs.text).toContain("validée");
  });

  test("un stagiaire ne peut pas ouvrir les documents d'un autre", async () => {
    const agent = await connexion("ali@demo.yt", "Stagiaire2026!");
    const res = await agent.get("/candidatures/1/fichier/cv"); // candidature de Fatima
    expect(res.status).toBe(403);
  });
});

describe("Rubriques Candidats, Agents et Documents", () => {
  test("le gestionnaire voit les candidats, les agents et tous les documents", async () => {
    const gest = await connexion("gestion@demo.yt", "Gestion2026!");
    expect((await gest.get("/candidats")).text).toContain("ATTOUMANI");
    expect((await gest.get("/agents")).text).toContain("MADI");
    expect((await gest.get("/documents")).text).toContain("Fatima ATTOUMANI");
  });

  test("un stagiaire ne voit que ses propres documents et n'a pas accès aux candidats", async () => {
    const agent = await connexion("ali@demo.yt", "Stagiaire2026!");
    const docs = await agent.get("/documents");
    expect(docs.status).toBe(200);
    expect(docs.text).not.toContain("ATTOUMANI");
    expect((await agent.get("/candidats")).status).toBe(403);
  });

  test("un visiteur qui clique sur Postuler est envoyé vers la connexion, puis revient à l'offre", async () => {
    const agent = request.agent(app);
    const r1 = await agent.get("/offres/3/candidater");
    expect(r1.headers.location).toBe("/connexion");
    const r2 = await agent.post("/connexion").type("form").send({ email: "fatima@demo.yt", mot_de_passe: "Stagiaire2026!" });
    expect(r2.headers.location).toBe("/offres/3/candidater");
  });
});

describe("Offres et messagerie", () => {
  test("le gestionnaire publie une offre", async () => {
    const gest = await connexion("gestion@demo.yt", "Gestion2026!");
    await gest.post("/gestion/offres/nouvelle").type("form").send({ titre: "Agent d'accueil", departement: "Accueil du public", places_disponibles: "2" });
    const res = await request(app).get("/offres");
    expect(res.text).toContain("Agent d&#39;accueil");
  });

  test("un stagiaire écrit à un gestionnaire, mais pas à un autre stagiaire", async () => {
    const agent = await connexion("ali@demo.yt", "Stagiaire2026!");
    await agent.post("/messages/2").type("form").send({ contenu: "Bonjour, une question sur mon stage." });
    const conv = await agent.get("/messages/2");
    expect(conv.text).toContain("une question sur mon stage");
    const interdit = await agent.post("/messages/3").type("form").send({ contenu: "Salut" });
    expect(interdit.status).toBe(403);
  });
});
