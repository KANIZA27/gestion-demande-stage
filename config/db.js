// Accès à la base de données.
// - Si DB_HOST est défini : connexion MySQL (mysql2), comme prévu dans le cahier des charges.
// - Sinon : base SQLite locale (fichier), pratique pour la démonstration sans serveur MySQL.
const path = require("path");

let impl;

if (process.env.DB_HOST) {
  const mysql = require("mysql2/promise");
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // jamais écrit en clair dans le code
    database: process.env.DB_NAME || "gestion_stage",
  });
  impl = {
    async all(sql, params = []) { const [rows] = await pool.execute(sql, params); return rows; },
    async get(sql, params = []) { const [rows] = await pool.execute(sql, params); return rows[0]; },
    async run(sql, params = []) { const [res] = await pool.execute(sql, params); return { id: res.insertId, changes: res.affectedRows }; },
    type: "mysql",
  };
} else {
  const { DatabaseSync } = require("node:sqlite");
  const file = process.env.DB_FILE || path.join(__dirname, "..", "database", "gestion_stage.sqlite");
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON");
  impl = {
    async all(sql, params = []) { return db.prepare(sql).all(...params); },
    async get(sql, params = []) { return db.prepare(sql).get(...params); },
    async run(sql, params = []) { const r = db.prepare(sql).run(...params); return { id: Number(r.lastInsertRowid), changes: r.changes }; },
    exec(sql) { db.exec(sql); },
    type: "sqlite",
  };
}

module.exports = impl;
