#!/usr/bin/env node
/**
 * Admin-Passwort setzen (Hostinger SSH oder lokal):
 *   ADMIN_USERNAME=martina ADMIN_PASSWORD='geheim123' node scripts/setup-admin.js
 */
require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const username = process.argv[2] || process.env.ADMIN_USERNAME || 'martina';
const password = process.argv[3] || process.env.ADMIN_PASSWORD;
const email = process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.sqlite');

if (!password || password.length < 8) {
  console.error('Passwort fehlt oder zu kurz (min. 8 Zeichen).');
  console.error('Usage: ADMIN_PASSWORD=xxx node scripts/setup-admin.js [username]');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);
const hash = bcrypt.hashSync(password, 10);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  db.get(`SELECT id FROM admins WHERE username = ?`, [username], (err, row) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    if (row) {
      db.run(`UPDATE admins SET password = ?, email = ? WHERE username = ?`, [hash, email, username], (e) => {
        if (e) console.error(e);
        else console.log(`Passwort für "${username}" aktualisiert.`);
        db.close();
      });
    } else {
      db.run(
        `INSERT INTO admins (username, password, email) VALUES (?, ?, ?)`,
        [username, hash, email],
        (e) => {
          if (e) console.error(e);
          else console.log(`Admin "${username}" angelegt. Login: /admin`);
          db.close();
        }
      );
    }
  });
});
