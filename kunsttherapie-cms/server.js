require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, "database.sqlite");
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-before-production";
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:8080,http://127.0.0.1:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const db = new sqlite3.Database(DATABASE_PATH);

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
}));
app.use(session({
  name: "kunsttherapie.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.use("/admin", express.static(path.join(__dirname, "public")));

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function onRun(error) {
    if (error) reject(error);
    else resolve({ id: this.lastID, changes: this.changes });
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (error, rows) => {
    if (error) reject(error);
    else resolve(rows);
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (error, row) => {
    if (error) reject(error);
    else resolve(row);
  });
});

async function initializeDatabase() {
  await run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'published',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT,
    location TEXT,
    capacity TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'published',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT,
    duration TEXT,
    image_url TEXT,
    active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  const admin = await get("SELECT id FROM admins WHERE username = ?", ["admin"]);
  if (!admin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 12);
    await run("INSERT INTO admins (username, password_hash) VALUES (?, ?)", ["admin", passwordHash]);
  }

  const newsCount = await get("SELECT COUNT(*) AS count FROM news");
  if (newsCount.count === 0) {
    await run("INSERT INTO news (title, content, date, status) VALUES (?, ?, ?, ?)", [
      "Neue kreative Gruppen starten",
      "Kleine, geschuetzte Gruppen fuer Menschen, die ueber Farbe, Ton und Collage wieder in Kontakt mit ihren Ressourcen kommen moechten.",
      "2026-06-04",
      "published"
    ]);
    await run("INSERT INTO news (title, content, date, status) VALUES (?, ?, ?, ?)", [
      "Offenes Atelier: Kunst als Auszeit",
      "Ein Abend zum Ankommen, Ausprobieren und Kraft schoepfen. Keine kuenstlerische Vorerfahrung notwendig.",
      "2026-06-18",
      "published"
    ]);
  }

  const eventCount = await get("SELECT COUNT(*) AS count FROM events");
  if (eventCount.count === 0) {
    await run("INSERT INTO events (title, description, event_date, event_time, location, capacity, status) VALUES (?, ?, ?, ?, ?, ?, ?)", [
      "Workshop: Aquarell & innere Landschaften",
      "Ein ruhiger Kunsttherapie-Workshop mit Materialerkundung, Impulsen und gemeinsamer Reflexion.",
      "2026-06-20",
      "17:30",
      "Otto-Stadler-Str. 23c, Paderborn",
      "8 Plaetze",
      "published"
    ]);
  }

  const serviceCount = await get("SELECT COUNT(*) AS count FROM services");
  if (serviceCount.count === 0) {
    const services = [
      ["Einzelbegleitung", "Individuelle kunsttherapeutische Begleitung in einem achtsamen, ressourcenorientierten Rahmen.", "auf Anfrage", "60-90 Minuten", 1],
      ["Gruppenangebote", "Kleine Gruppen mit Ton, Farbe, Collage und kreativen Methoden zur Staerkung von Ausdruck und Selbstwirksamkeit.", "ab 55 EUR", "fortlaufend", 2],
      ["Workshops fuer Teams", "Kreative Auszeiten fuer Teams, Einrichtungen und Gruppen mit professioneller Prozessbegleitung.", "auf Anfrage", "halb-/ganztags", 3]
    ];
    for (const service of services) {
      await run("INSERT INTO services (title, description, price, duration, sort_order, active) VALUES (?, ?, ?, ?, ?, 1)", service);
    }
  }
}

function requireAuth(req, res, next) {
  if (req.session?.adminId) return next();
  return res.status(401).json({ error: "Nicht angemeldet" });
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body[field] || "").trim());
  if (missing.length) {
    const error = new Error(`Pflichtfelder fehlen: ${missing.join(", ")}`);
    error.status = 400;
    throw error;
  }
}

app.get("/", (req, res) => {
  res.json({
    name: "Kunsttherapie CMS",
    status: "ok",
    admin: "/admin",
    api: ["/api/news", "/api/events", "/api/services"]
  });
});

app.get("/api/health", asyncHandler(async (req, res) => {
  const tables = await Promise.all([
    get("SELECT COUNT(*) AS count FROM news"),
    get("SELECT COUNT(*) AS count FROM events"),
    get("SELECT COUNT(*) AS count FROM services")
  ]);
  res.json({ status: "ok", news: tables[0].count, events: tables[1].count, services: tables[2].count });
}));

app.post("/api/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  requireFields(req.body, ["username", "password"]);
  const admin = await get("SELECT * FROM admins WHERE username = ?", [username]);
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return res.status(401).json({ error: "Login fehlgeschlagen" });
  }
  req.session.adminId = admin.id;
  req.session.username = admin.username;
  return res.json({ ok: true, username: admin.username });
}));

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/session", (req, res) => {
  res.json({ authenticated: Boolean(req.session?.adminId), username: req.session?.username || null });
});

app.get("/api/news", asyncHandler(async (req, res) => {
  const rows = await all("SELECT * FROM news WHERE status = 'published' ORDER BY date DESC, created_at DESC");
  res.json(rows);
}));

app.get("/api/events", asyncHandler(async (req, res) => {
  const rows = await all("SELECT * FROM events WHERE status = 'published' ORDER BY event_date ASC, event_time ASC");
  res.json(rows);
}));

app.get("/api/services", asyncHandler(async (req, res) => {
  const rows = await all("SELECT * FROM services WHERE active = 1 ORDER BY sort_order ASC, id ASC");
  res.json(rows);
}));

app.get("/api/admin/:resource", requireAuth, asyncHandler(async (req, res) => {
  const table = tableFor(req.params.resource);
  const order = table === "events" ? "event_date ASC" : table === "services" ? "sort_order ASC, id ASC" : "date DESC, created_at DESC";
  res.json(await all(`SELECT * FROM ${table} ORDER BY ${order}`));
}));

app.post("/api/admin/news", requireAuth, asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "content", "date"]);
  const result = await run(
    "INSERT INTO news (title, content, date, image_url, status) VALUES (?, ?, ?, ?, ?)",
    [req.body.title, req.body.content, req.body.date, req.body.image_url || "", req.body.status || "published"]
  );
  res.status(201).json({ id: result.id });
}));

app.put("/api/admin/news/:id", requireAuth, asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "content", "date"]);
  await run(
    "UPDATE news SET title = ?, content = ?, date = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [req.body.title, req.body.content, req.body.date, req.body.image_url || "", req.body.status || "published", req.params.id]
  );
  res.json({ ok: true });
}));

app.delete("/api/admin/news/:id", requireAuth, asyncHandler(async (req, res) => {
  await run("DELETE FROM news WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
}));

app.post("/api/admin/events", requireAuth, asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "description", "event_date"]);
  const result = await run(
    "INSERT INTO events (title, description, event_date, event_time, location, capacity, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [req.body.title, req.body.description, req.body.event_date, req.body.event_time || "", req.body.location || "", req.body.capacity || "", req.body.image_url || "", req.body.status || "published"]
  );
  res.status(201).json({ id: result.id });
}));

app.put("/api/admin/events/:id", requireAuth, asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "description", "event_date"]);
  await run(
    "UPDATE events SET title = ?, description = ?, event_date = ?, event_time = ?, location = ?, capacity = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [req.body.title, req.body.description, req.body.event_date, req.body.event_time || "", req.body.location || "", req.body.capacity || "", req.body.image_url || "", req.body.status || "published", req.params.id]
  );
  res.json({ ok: true });
}));

app.delete("/api/admin/events/:id", requireAuth, asyncHandler(async (req, res) => {
  await run("DELETE FROM events WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
}));

app.post("/api/admin/services", requireAuth, asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "description"]);
  const result = await run(
    "INSERT INTO services (title, description, price, duration, image_url, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [req.body.title, req.body.description, req.body.price || "", req.body.duration || "", req.body.image_url || "", req.body.active === false ? 0 : 1, Number(req.body.sort_order || 0)]
  );
  res.status(201).json({ id: result.id });
}));

app.put("/api/admin/services/:id", requireAuth, asyncHandler(async (req, res) => {
  requireFields(req.body, ["title", "description"]);
  await run(
    "UPDATE services SET title = ?, description = ?, price = ?, duration = ?, image_url = ?, active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [req.body.title, req.body.description, req.body.price || "", req.body.duration || "", req.body.image_url || "", req.body.active === false || req.body.active === 0 ? 0 : 1, Number(req.body.sort_order || 0), req.params.id]
  );
  res.json({ ok: true });
}));

app.delete("/api/admin/services/:id", requireAuth, asyncHandler(async (req, res) => {
  await run("DELETE FROM services WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
}));

function tableFor(resource) {
  if (!["news", "events", "services"].includes(resource)) {
    const error = new Error("Unbekannte Ressource");
    error.status = 404;
    throw error;
  }
  return resource;
}

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: error.message || "Serverfehler" });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Kunsttherapie CMS Backend");
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Admin Panel: http://localhost:${PORT}/admin`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed", error);
    process.exit(1);
  });
