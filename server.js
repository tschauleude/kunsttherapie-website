const express = require('express');
const compression = require('compression');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const siteImages = require('./lib/site-images');
const media = require('./lib/media');
const contentVersions = require('./lib/content-versions');
const imageMeta = require('./lib/image-meta');
const backup = require('./lib/backup');
const { resolveAppSecret } = require('./lib/secret');
const { apiLang, apiMsg } = require('./lib/api-messages');
require('dotenv').config();

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_PATH = process.env.DATABASE_PATH || path.join(ROOT, 'database.sqlite');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Hostinger / Passenger: echte Client-IP für Rate-Limits und Session-Cookies
app.set('trust proxy', 1);

// Ensure upload directory exists (Hostinger redeploy may wipe empty dirs)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(PUBLIC_DIR, 'uploads');
const ATELIER_DIR = path.join(UPLOAD_DIR, 'atelier');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(ATELIER_DIR, { recursive: true });

const atelierSubmitCounts = new Map();

// Dateiendung NUR aus dem validierten MIME-Type ableiten – niemals aus dem
// (fälschbaren) Client-Dateinamen. Sonst könnte z. B. eine als image/jpeg
// deklarierte "shell.html" als .html im web-erreichbaren Upload-Ordner landen.
const IMAGE_MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = IMAGE_MIME_EXT[file.mimetype] || '.jpg';
      cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
    },
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) },
  fileFilter: (req, file, cb) => {
    if (IMAGE_MIME_EXT[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilder (JPG, PNG, GIF, WebP)'));
    }
  },
});

const atelierUpload = multer({
  storage: multer.diskStorage({
    destination: ATELIER_DIR,
    filename: (req, file, cb) => {
      const ext = IMAGE_MIME_EXT[file.mimetype] || '.png';
      cb(null, `atelier-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
    },
  }),
  limits: { fileSize: parseInt(process.env.ATELIER_MAX_FILE_SIZE || '8388608', 10) },
  fileFilter: (req, file, cb) => {
    if (IMAGE_MIME_EXT[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien erlaubt'));
    }
  },
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  imgSrc: ["'self'", 'data:'],
  styleSrc: ["'self'", "'unsafe-inline'"],
  fontSrc: ["'self'"],
  scriptSrc: ["'self'"],
  scriptSrcAttr: ["'unsafe-inline'"],
  connectSrc: ["'self'"],
  frameSrc: ["'self'", 'https://maps.google.com', 'https://www.google.com'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  frameAncestors: ["'none'"],
};

app.use(
  helmet({
    contentSecurityPolicy: { directives: CSP_DIRECTIVES },
    crossOriginEmbedderPolicy: false,
    frameguard: false,
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
if (corsOrigins.length) {
  app.use(cors({ origin: corsOrigins, credentials: true }));
}

const rateLimitJson = (message) => ({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: message });
  },
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({ error: 'Zu viele Login-Versuche – bitte in 15 Minuten erneut versuchen.' });
  },
});

const bookingRateLimiter = rateLimit({
  ...rateLimitJson('Zu viele Buchungsanfragen – bitte in einer Stunde erneut versuchen.'),
});

const contactRateLimiter = rateLimit({
  ...rateLimitJson('Zu viele Nachrichten – bitte in einer Stunde erneut versuchen.'),
});

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const ASSET_MAX_AGE = '1y';
const assetStatic = express.static(path.join(ROOT, 'assets'), {
  maxAge: ASSET_MAX_AGE,
  immutable: true,
  etag: true,
  setHeaders(res, filePath) {
    const base = path.basename(filePath);
    if (/\.html?$/i.test(base)) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }
    // Nur Dateien mit Content-Hash im Namen (z. B. style.beb06571.css) dürfen
    // dauerhaft "immutable" gecacht werden. Unversionierte CSS/JS – etwa das
    // Admin-Stylesheet oder Vendor-Dateien – müssen revalidieren, sonst erreichen
    // Änderungen den Browser ein Jahr lang nicht (immutable = keine Revalidierung).
    const isHashed = /\.[0-9a-f]{8,}\.[a-z0-9]+$/i.test(base);
    if (/\.(css|js)$/i.test(base) && !isHashed) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
});

// Static: admin panel, uploads, assets (css/js/img)
app.use('/assets', assetStatic);
app.use(express.static(PUBLIC_DIR, { maxAge: '1h', etag: true }));

// Session-Secret: zentral über lib/secret (ENV bevorzugt, sonst persistiertes
// Zufalls-Secret) – dasselbe Secret signiert auch die Kalender-Token.
// Session Configuration
app.use(session({
  secret: resolveAppSecret(),
  resave: false,
  saveUninitialized: false,
  proxy: IS_PRODUCTION,
  cookie: {
    secure: IS_PRODUCTION,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ============================================================================
// DATENBANK SETUP
// ============================================================================

let markDbReady;
const dbReady = new Promise((resolve) => { markDbReady = resolve; });

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image TEXT,
        published INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        location TEXT,
        capacity INTEGER,
        image TEXT,
        published INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        google_event_id TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // DB-seitige Sperre gegen Doppelbuchungen (schließt die Race-Condition
    // zwischen Verfügbarkeitsprüfung und INSERT). Stornierte Termine zählen nicht.
    db.run(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot
       ON bookings(date, start_time) WHERE status != 'cancelled'`,
      (idxErr) => {
        if (idxErr) console.error('Buchungs-Index konnte nicht erstellt werden:', idxErr.message);
      }
    );

    db.run(`
      CREATE TABLE IF NOT EXISTS atelier_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_path TEXT NOT NULL,
        is_anonymous INTEGER DEFAULT 1,
        submitter_name TEXT,
        submitter_email TEXT,
        note TEXT,
        status TEXT DEFAULT 'new',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        email_sent INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS site_images (
        slot TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price TEXT,
        duration TEXT,
        image TEXT,
        active INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS content_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        label TEXT NOT NULL,
        snapshot TEXT NOT NULL,
        meta TEXT,
        createdBy TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Database schema error:', err);
        return;
      }
      ensureAdminAccounts();
      console.log(' Database initialized');
      if (markDbReady) markDbReady();
    });
  });
}

function ensureAdminAccounts() {
  const envUser = process.env.ADMIN_USERNAME;
  const envPass = process.env.ADMIN_PASSWORD;
  const envEmail = process.env.ADMIN_EMAIL || 'info@kunsttherapie-pb.de';

  if (envUser && envPass) {
    const hash = bcryptjs.hashSync(envPass, 10);
    db.get(`SELECT id FROM admins WHERE username = ?`, [envUser], (err, row) => {
      if (err) {
        console.error('Admin env setup error:', err);
        return;
      }
      if (row) {
        db.run(`UPDATE admins SET password = ?, email = ? WHERE username = ?`, [hash, envEmail, envUser]);
        console.log(` Admin "${envUser}" Passwort aus .env aktualisiert`);
      } else {
        db.run(
          `INSERT INTO admins (username, password, email) VALUES (?, ?, ?)`,
          [envUser, hash, envEmail],
          (insertErr) => {
            if (insertErr) console.error('Admin env insert error:', insertErr);
            else console.log(` Admin "${envUser}" aus .env angelegt`);
          }
        );
      }
    });
    return;
  }

  db.get(`SELECT COUNT(*) AS count FROM admins`, (err, row) => {
    if (err) {
      console.error('Admin check error:', err);
      return;
    }
    if (row && row.count > 0) return;

    // Kein bekanntes Default-Passwort mehr: ein zufälliges erzeugen und einmalig
    // ins Server-Log schreiben. Wer ADMIN_USERNAME/ADMIN_PASSWORD setzt, landet
    // hier gar nicht erst.
    const generatedPassword = require('crypto').randomBytes(9).toString('base64url');
    const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
    db.run(
      `INSERT INTO admins (username, password, email) VALUES (?, ?, ?)`,
      ['admin', hashedPassword, envEmail],
      (insertErr) => {
        if (insertErr) {
          console.error('Error creating default admin:', insertErr);
        } else {
          console.log('====================================================');
          console.log(' Erst-Admin angelegt – Benutzername: admin');
          console.log(`   Passwort (NUR jetzt sichtbar): ${generatedPassword}`);
          console.log('   Bitte nach dem Login ändern oder ADMIN_USERNAME/');
          console.log('   ADMIN_PASSWORD in der .env setzen.');
          console.log('====================================================');
        }
      }
    );
  });
}

// ============================================================================
// MIDDLEWARE: Authentication Check
// ============================================================================

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const booking = require('./lib/booking');
const googleCalendar = require('./lib/google-calendar');
const ical = require('./lib/ical');
const email = require('./lib/email');
const i18nContent = require('./lib/i18n-content');

function publicBaseUrl(req) {
  const fromEnv = process.env.PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function getGoogleRefreshToken(callback) {
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    return callback(null, process.env.GOOGLE_REFRESH_TOKEN);
  }
  db.get(`SELECT value FROM settings WHERE key = ?`, ['google_refresh_token'], (err, row) => {
    if (err) return callback(err);
    callback(null, row ? row.value : null);
  });
}

function saveGoogleRefreshToken(token, callback) {
  db.run(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    ['google_refresh_token', token],
    callback
  );
}

// Promise-Variante: löst mit Token (oder null bei Fehler/keinem Token) auf,
// damit Routen sie sauber per await im eigenen try/catch nutzen können –
// statt loser async-Callbacks, deren Fehler unbemerkt blieben.
function getGoogleRefreshTokenAsync() {
  return new Promise((resolve) => {
    getGoogleRefreshToken((err, token) => {
      if (err) {
        console.error('Google token lookup:', err.message);
        return resolve(null);
      }
      resolve(token || null);
    });
  });
}

// Google-Kalender-Sync als awaitbare Helfer (Fehler werden geloggt, brechen die
// Buchung aber nicht ab). Ersetzt die früheren losen async-Callbacks.
async function syncGoogleCreate(row) {
  try {
    const token = await getGoogleRefreshTokenAsync();
    if (!token) return;
    const googleEventId = await googleCalendar.createCalendarEvent(token, row);
    if (googleEventId) {
      await dbRun(`UPDATE bookings SET google_event_id = ? WHERE id = ?`, [googleEventId, row.id]);
    }
  } catch (e) {
    console.error('Google event create failed:', e.message);
  }
}

async function syncGoogleDelete(googleEventId) {
  try {
    const token = await getGoogleRefreshTokenAsync();
    if (!token) return;
    await googleCalendar.deleteCalendarEvent(token, googleEventId);
  } catch (e) {
    console.error('Google delete failed:', e.message);
  }
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function getBusyForRange(fromStr, toStr) {
  const days = booking.eachDayInRange(fromStr, toStr);
  const rows = await dbAll(
    `SELECT * FROM bookings WHERE date >= ? AND date <= ? AND status != 'cancelled'`,
    [fromStr, toStr]
  );
  const localBusy = booking.bookingsToIntervals(rows);

  return new Promise((resolve) => {
    getGoogleRefreshToken(async (err, token) => {
      if (err) {
        console.error('Google token lookup:', err.message);
      }
      let googleBusy = [];
      if (!err && token) {
        try {
          const timeMin = booking.parseDateTime(fromStr, '00:00');
          const timeMax = booking.parseDateTime(toStr, '23:59');
          timeMax.setHours(23, 59, 59, 999);
          googleBusy = await googleCalendar.fetchBusyIntervals(token, timeMin, timeMax);
        } catch (e) {
          console.error('Google Calendar sync error:', e.message);
        }
      }
      resolve({ localBusy, googleBusy, days });
    });
  });
}

function busyForDate(dateStr, localBusy, googleBusy) {
  const dayStart = booking.parseDateTime(dateStr, '00:00');
  const dayEnd = booking.parseDateTime(dateStr, '23:59');
  dayEnd.setHours(23, 59, 59, 999);

  const intervals = [];
  localBusy.forEach((b) => {
    if (booking.overlaps(b.start, b.end, dayStart, dayEnd)) {
      intervals.push(b);
    }
  });
  googleBusy.forEach((b) => {
    if (booking.overlaps(b.start, b.end, dayStart, dayEnd)) {
      intervals.push(b);
    }
  });
  return intervals;
}

// ============================================================================
// AUTH ROUTES
// ============================================================================

// Login
app.post('/api/auth/login', loginRateLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(
    `SELECT * FROM admins WHERE username = ?`,
    [username],
    (err, admin) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = bcryptjs.compareSync(password, admin.password);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Session-ID nach erfolgreichem Login erneuern (Schutz vor Session-Fixation).
      req.session.regenerate((regenErr) => {
        if (regenErr) {
          return res.status(500).json({ error: 'Session error' });
        }
        req.session.userId = admin.id;
        req.session.username = admin.username;
        req.session.save((saveErr) => {
          if (saveErr) {
            return res.status(500).json({ error: 'Session error' });
          }
          res.json({
            success: true,
            message: 'Logged in successfully',
            username: admin.username,
          });
        });
      });
    }
  );
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out' });
  });
});

// Check Auth Status
app.get('/api/auth/status', (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      username: req.session.username
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Einmalige Ersteinrichtung (nur wenn noch kein Admin existiert)
app.post('/api/auth/setup', (req, res) => {
  const setupToken = process.env.SETUP_TOKEN;
  const { token, username, password, email } = req.body;

  if (!setupToken) {
    return res.status(503).json({
      error: 'SETUP_TOKEN ist nicht konfiguriert. Bitte ADMIN_USERNAME und ADMIN_PASSWORD in .env setzen.',
    });
  }
  if (token !== setupToken) {
    return res.status(403).json({ error: 'Ungültiger Setup-Token' });
  }
  if (!username || !password || password.length < 8) {
    return res.status(400).json({ error: 'Benutzername und Passwort (min. 8 Zeichen) erforderlich' });
  }

  db.get(`SELECT COUNT(*) AS count FROM admins`, (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (row.count > 0) {
      return res.status(409).json({ error: 'Es existiert bereits ein Admin-Konto' });
    }

    const hash = bcryptjs.hashSync(password, 10);
    db.run(
      `INSERT INTO admins (username, password, email) VALUES (?, ?, ?)`,
      [username, hash, email || 'info@kunsttherapie-pb.de'],
      function onInsert(insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: 'Admin konnte nicht angelegt werden' });
        }
        const newId = this.lastID;
        // Session-ID erneuern (Schutz vor Session-Fixation).
        req.session.regenerate((regenErr) => {
          if (regenErr) return res.status(500).json({ error: 'Session error' });
          req.session.userId = newId;
          req.session.username = username;
          req.session.save((saveErr) => {
            if (saveErr) return res.status(500).json({ error: 'Session error' });
            res.json({
              success: true,
              message: 'Admin-Konto erstellt. Du bist jetzt angemeldet.',
              username,
            });
          });
        });
      }
    );
  });
});

app.post('/api/admin/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Aktuelles und neues Passwort (min. 8 Zeichen) erforderlich' });
  }

  db.get(`SELECT * FROM admins WHERE id = ?`, [req.session.userId], (err, admin) => {
    if (err || !admin) {
      return res.status(500).json({ error: 'Benutzer nicht gefunden' });
    }
    if (!bcryptjs.compareSync(currentPassword, admin.password)) {
      return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
    }

    const hash = bcryptjs.hashSync(newPassword, 10);
    db.run(`UPDATE admins SET password = ? WHERE id = ?`, [hash, admin.id], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: 'Passwort konnte nicht gespeichert werden' });
      res.json({ success: true, message: 'Passwort geändert' });
    });
  });
});

// ============================================================================
// NEWS API ROUTES
// ============================================================================

// Get all news (public)
app.get('/api/news', (req, res) => {
  db.all(
    `SELECT * FROM news WHERE published = 1 ORDER BY createdAt DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get all news (admin - including unpublished)
app.get('/api/admin/news', requireAuth, (req, res) => {
  db.all(
    `SELECT * FROM news ORDER BY createdAt DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get single news (admin, inkl. Entwürfe)
app.get('/api/admin/news/:id', requireAuth, (req, res) => {
  db.get(`SELECT * FROM news WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Get single news
app.get('/api/news/:id', (req, res) => {
  db.get(
    `SELECT * FROM news WHERE id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(row);
    }
  );
});

// Create news (admin)
app.post('/api/admin/news', requireAuth, (req, res) => {
  const { title, content, image, published } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  db.run(
    `INSERT INTO news (title, content, image, published) VALUES (?, ?, ?, ?)`,
    [title, content, image || null, published ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        success: true,
        id: this.lastID,
        message: 'News created successfully'
      });
    }
  );
});

// Update news (admin)
app.put('/api/admin/news/:id', requireAuth, (req, res) => {
  const { title, content, image, published } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  db.run(
    `UPDATE news SET title = ?, content = ?, image = ?, published = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [title, content, image || null, published ? 1 : 0, req.params.id],
    function onUpdate(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, message: 'News updated successfully' });
    }
  );
});

// Toggle published (admin) – quick publish/unpublish without full update
app.patch('/api/admin/news/:id/published', requireAuth, (req, res) => {
  const { published } = req.body;
  if (typeof published === 'undefined') {
    return res.status(400).json({ error: 'published field required' });
  }
  db.run(
    `UPDATE news SET published = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [published ? 1 : 0, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, published: published ? 1 : 0 });
    }
  );
});

// Delete news (admin)
app.delete('/api/admin/news/:id', requireAuth, (req, res) => {
  db.run(
    `DELETE FROM news WHERE id = ?`,
    [req.params.id],
    function onDelete(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, message: 'News deleted successfully' });
    }
  );
});

// ============================================================================
// EVENTS API ROUTES
// ============================================================================

// Get all events (public)
app.get('/api/events', (req, res) => {
  db.all(
    `SELECT * FROM events WHERE published = 1 ORDER BY date DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get single event (admin, inkl. Entwürfe)
app.get('/api/admin/events/:id', requireAuth, (req, res) => {
  db.get(`SELECT * FROM events WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Get all events (admin)
app.get('/api/admin/events', requireAuth, (req, res) => {
  db.all(
    `SELECT * FROM events ORDER BY date DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Create event (admin)
app.post('/api/admin/events', requireAuth, (req, res) => {
  const { title, description, date, time, location, capacity, image, published } = req.body;

  if (!title || !description || !date) {
    return res.status(400).json({ error: 'Title, description, and date required' });
  }

  db.run(
    `INSERT INTO events (title, description, date, time, location, capacity, image, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, date, time || null, location || null, capacity || null, image || null, published ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        success: true,
        id: this.lastID,
        message: 'Event created successfully'
      });
    }
  );
});

// Update event (admin)
app.put('/api/admin/events/:id', requireAuth, (req, res) => {
  const { title, description, date, time, location, capacity, image, published } = req.body;

  if (!title || !description || !date) {
    return res.status(400).json({ error: 'Title, description, and date required' });
  }

  db.run(
    `UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ?, capacity = ?, image = ?, published = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [title, description, date, time || null, location || null, capacity || null, image || null, published ? 1 : 0, req.params.id],
    function onUpdate(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, message: 'Event updated successfully' });
    }
  );
});

// Delete event (admin)
app.delete('/api/admin/events/:id', requireAuth, (req, res) => {
  db.run(
    `DELETE FROM events WHERE id = ?`,
    [req.params.id],
    function onDelete(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, message: 'Event deleted successfully' });
    }
  );
});

// ============================================================================
// SERVICES API ROUTES
// ============================================================================

// Get all services
app.get('/api/services', (req, res) => {
  db.all(
    `SELECT * FROM services WHERE active = 1`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get single service (admin)
app.get('/api/admin/services/:id', requireAuth, (req, res) => {
  db.get(`SELECT * FROM services WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Get all services (admin)
app.get('/api/admin/services', requireAuth, (req, res) => {
  db.all(
    `SELECT * FROM services ORDER BY createdAt DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Create service (admin)
app.post('/api/admin/services', requireAuth, (req, res) => {
  const { title, description, price, duration, image, active } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required' });
  }

  db.run(
    `INSERT INTO services (title, description, price, duration, image, active) VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description, price || null, duration || null, image || null, active ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        success: true,
        id: this.lastID,
        message: 'Service created successfully'
      });
    }
  );
});

// Update service (admin)
app.put('/api/admin/services/:id', requireAuth, (req, res) => {
  const { title, description, price, duration, image, active } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required' });
  }

  db.run(
    `UPDATE services SET title = ?, description = ?, price = ?, duration = ?, image = ?, active = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [title, description, price || null, duration || null, image || null, active ? 1 : 0, req.params.id],
    function onUpdate(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, message: 'Service updated successfully' });
    }
  );
});

// Delete service (admin)
app.delete('/api/admin/services/:id', requireAuth, (req, res) => {
  db.run(
    `DELETE FROM services WHERE id = ?`,
    [req.params.id],
    function onDelete(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, message: 'Service deleted successfully' });
    }
  );
});

// ============================================================================
// BOOKING & GOOGLE CALENDAR
// ============================================================================

app.get('/api/bookings/config', (req, res) => {
  res.json({
    slotMinutes: booking.SLOT_MINUTES,
    schedule: booking.getScheduleForApi(),
    minAdvanceHours: booking.MIN_ADVANCE_HOURS,
    timezone: process.env.BOOKING_TIMEZONE || 'Europe/Berlin',
    emailConfigured: email.isEmailConfigured(),
    googleCalendarOptional: true,
  });
});

app.get('/api/bookings/availability', async (req, res) => {
  const month = req.query.month;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Parameter month erforderlich (YYYY-MM)' });
  }

  try {
    const { from, to, daysInMonth, year, month: mo } = booking.monthRange(month);
    const { localBusy, googleBusy } = await getBusyForRange(from, to);

    const days = {};
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dateStr = `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const intervals = busyForDate(dateStr, localBusy, googleBusy);
      const slots = booking.slotsWithAvailability(dateStr, intervals);
      const availableCount = slots.filter((s) => s.available).length;
      days[dateStr] = {
        workingDay: booking.isWorkingDay(dateStr),
        slots,
        hasAvailability: availableCount > 0,
        availableCount,
      };
    }

    getGoogleRefreshToken((err, token) => {
      if (err) {
        console.error('Google token lookup:', err.message);
      }
      res.json({
        month,
        from,
        to,
        days,
        googleCalendarConnected: Boolean(!err && token),
        emailConfigured: email.isEmailConfigured(),
      });
    });
  } catch (e) {
    console.error('availability error:', e);
    res.status(500).json({ error: 'Verfügbarkeit konnte nicht geladen werden' });
  }
});

app.get('/api/bookings/slots', async (req, res) => {
  const dateStr = req.query.date;
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ error: 'Parameter date erforderlich (YYYY-MM-DD)' });
  }

  try {
    const { localBusy, googleBusy } = await getBusyForRange(dateStr, dateStr);
    const intervals = busyForDate(dateStr, localBusy, googleBusy);
    const slots = booking.slotsWithAvailability(dateStr, intervals);

    getGoogleRefreshToken((err, token) => {
      if (err) {
        console.error('Google token lookup:', err.message);
      }
      res.json({
        date: dateStr,
        workingDay: booking.isWorkingDay(dateStr),
        slots,
        googleCalendarConnected: Boolean(!err && token),
      });
    });
  } catch (e) {
    console.error('slots error:', e);
    res.status(500).json({ error: 'Slots konnten nicht geladen werden' });
  }
});

app.get('/api/bookings/:id/calendar.ics', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { token } = req.query;

  if (!id || !ical.verifyBookingToken(id, token)) {
    return res.status(403).send('Ungültiger Kalender-Link');
  }

  try {
    const row = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [id]);
    if (!row || row.status === 'cancelled') {
      return res.status(404).send('Termin nicht gefunden');
    }
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="termin-kunsttherapie-${id}.ics"`);
    res.send(ical.buildIcs(row));
  } catch (e) {
    console.error('ics error:', e);
    res.status(500).send('Kalenderdatei konnte nicht erstellt werden');
  }
});

app.post('/api/contact', contactRateLimiter, async (req, res) => {
  const lang = apiLang(req);
  const honeypot = String(req.body.website ?? req.body._hp ?? '').trim();
  if (honeypot) {
    return res.json({
      success: true,
      message: apiMsg('contact.success', lang),
    });
  }

  const { name, email: fromEmail, phone, message } = req.body;

  if (!name || !fromEmail || !message) {
    return res.status(400).json({ error: apiMsg('contact.required', lang) });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return res.status(400).json({ error: apiMsg('contact.invalidEmail', lang) });
  }

  const payload = {
    name: name.trim(),
    email: fromEmail.trim(),
    phone: phone ? phone.trim() : '',
    message: message.trim(),
  };

  // Nachricht IMMER zuerst in der DB sichern – so geht sie auch dann nicht
  // verloren, wenn der E-Mail-Versand scheitert (z. B. SMTP nicht erreichbar).
  let saved = false;
  let savedId = null;
  try {
    const ins = await dbRun(
      `INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)`,
      [payload.name, payload.email, payload.phone || null, payload.message]
    );
    savedId = ins.lastID;
    saved = true;
  } catch (dbErr) {
    console.error('contact persist error:', dbErr.message);
  }

  let sent = false;
  try {
    const result = await email.sendContactMessage(payload);
    sent = Boolean(result.sent);
  } catch (e) {
    console.error('contact email error:', e.message);
  }

  if (sent && savedId) {
    dbRun(`UPDATE contact_messages SET email_sent = 1 WHERE id = ?`, [savedId]).catch(() => {});
  }

  if (sent) {
    return res.json({ success: true, message: apiMsg('contact.success', lang) });
  }
  if (saved) {
    // E-Mail fehlgeschlagen, aber Nachricht ist gespeichert → Besucher nicht abweisen.
    return res.json({ success: true, message: apiMsg('contact.success', lang) });
  }
  // Weder Mail noch Speicherung möglich – ehrliche Fehlermeldung.
  res.status(503).json({ error: apiMsg('contact.mailFailed', lang) });
});

// Gespeicherte Kontaktnachrichten (Fallback-Einsicht, falls E-Mail mal ausfällt)
app.get('/api/admin/contact-messages', requireAuth, (req, res) => {
  db.all(
    `SELECT id, name, email, phone, message, email_sent, createdAt
     FROM contact_messages ORDER BY createdAt DESC LIMIT 200`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows || []);
    }
  );
});

app.post('/api/bookings', bookingRateLimiter, async (req, res) => {
  const lang = apiLang(req);
  const honeypot = String(req.body.website ?? req.body._hp ?? '').trim();
  if (honeypot) {
    return res.json({
      success: true,
      message: apiMsg('booking.success', lang),
    });
  }

  // Zeit-Falle gegen Bots: nur greifen, wenn das Formular plausibel in unter
  // ~1,2 s abgeschickt wurde. elapsed >= 0 schließt Uhr-Vorlauf des Clients aus,
  // damit legitime (nur leicht abweichende) Uhren nicht fälschlich blockiert werden.
  const formAt = Number(req.body._formAt);
  const elapsed = Number.isFinite(formAt) && formAt > 0 ? Date.now() - formAt : null;
  if (elapsed !== null && elapsed >= 0 && elapsed < 1200) {
    return res.json({
      success: true,
      message: apiMsg('booking.success', lang),
    });
  }

  const { name, email, phone, date, startTime, message } = booking.normalizeBookingPayload(req.body);

  if (!name || !email || !date || !startTime) {
    return res.status(400).json({ error: apiMsg('booking.required', lang) });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: apiMsg('contact.invalidEmail', lang) });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime)) {
    return res.status(400).json({ error: apiMsg('booking.invalidDateTime', lang) });
  }
  if (!booking.isWorkingDay(date)) {
    return res.status(400).json({ error: apiMsg('booking.noWorkingDay', lang) });
  }
  if (booking.isSlotInPast(date, startTime)) {
    return res.status(400).json({ error: apiMsg('booking.tooSoon', lang) });
  }

  const daySlots = booking.generateSlotsForDay(date);
  const slot = daySlots.find((s) => s.start === startTime);
  if (!slot) {
    return res.status(400).json({ error: apiMsg('booking.invalidSlot', lang) });
  }

  try {
    const { localBusy, googleBusy } = await getBusyForRange(date, date);
    const intervals = busyForDate(date, localBusy, googleBusy);
    const available = booking.slotsWithAvailability(date, intervals);
    const chosen = available.find((s) => s.start === startTime);
    if (!chosen || !chosen.available) {
      return res.status(409).json({ error: apiMsg('booking.unavailable', lang) });
    }

    const result = await dbRun(
      `INSERT INTO bookings (name, email, phone, date, start_time, end_time, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [name.trim(), email.trim(), phone ? phone.trim() : null, date, slot.start, slot.end, message ? message.trim() : null]
    );

    const row = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [result.lastID]);

    let emailSent = false;
    try {
      const emailResult = await email.sendBookingRequestEmails(row);
      emailSent = Boolean(emailResult.sent);
    } catch (mailErr) {
      console.error('Booking request email failed:', mailErr.message);
    }

    res.json({
      success: true,
      id: row.id,
      status: 'pending',
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      emailSent,
      message: emailSent
        ? apiMsg('booking.successEmail', lang)
        : apiMsg('booking.successSaved', lang),
    });
  } catch (e) {
    if (e && (e.code === 'SQLITE_CONSTRAINT' || /UNIQUE constraint/i.test(e.message || ''))) {
      // Paralleler Buchungsversuch hat den Slot gerade belegt.
      return res.status(409).json({ error: apiMsg('booking.unavailable', lang) });
    }
    console.error('booking create error:', e);
    res.status(500).json({ error: apiMsg('booking.failed', lang) });
  }
});

function atelierRateLimit(req) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  // Abgelaufene Einträge entfernen, damit die Map nicht unbegrenzt wächst.
  for (const [key, e] of atelierSubmitCounts) {
    if (now - e.start > hour) atelierSubmitCounts.delete(key);
  }
  let entry = atelierSubmitCounts.get(ip);
  if (!entry || now - entry.start > hour) {
    entry = { start: now, count: 0 };
    atelierSubmitCounts.set(ip, entry);
  }
  entry.count += 1;
  return entry.count <= parseInt(process.env.ATELIER_RATE_LIMIT || '8', 10);
}

app.post('/api/atelier/submit', (req, res) => {
  if (!atelierRateLimit(req)) {
    return res.status(429).json({ error: apiMsg('atelier.rateLimit', apiLang(req)) });
  }

  atelierUpload.single('image')(req, res, async (err) => {
    const lang = apiLang(req);
    if (err) {
      return res.status(400).json({ error: err.message || apiMsg('atelier.uploadFailed', lang) });
    }
    if (!req.file) {
      return res.status(400).json({ error: apiMsg('atelier.imageRequired', lang) });
    }

    const anonymous = req.body.anonymous === '1' || req.body.anonymous === 'true';
    const name = (req.body.name || '').trim().slice(0, 120);
    const emailAddr = (req.body.email || '').trim().slice(0, 200);
    const note = (req.body.note || '').trim().slice(0, 2000);

    if (!anonymous && !name && !emailAddr) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
      return res.status(400).json({
        error: apiMsg('atelier.identityRequired', lang),
      });
    }

    if (emailAddr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddr)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
      return res.status(400).json({ error: apiMsg('contact.invalidEmail', lang) });
    }

    const relPath = path.join('atelier', req.file.filename).replace(/\\/g, '/');

    try {
      const result = await dbRun(
        `INSERT INTO atelier_submissions (image_path, is_anonymous, submitter_name, submitter_email, note, status)
         VALUES (?, ?, ?, ?, ?, 'new')`,
        [
          relPath,
          anonymous ? 1 : 0,
          anonymous ? null : name || null,
          anonymous ? null : emailAddr || null,
          note || null,
        ]
      );

      const row = await dbGet(`SELECT * FROM atelier_submissions WHERE id = ?`, [result.lastID]);

      try {
        await email.sendAtelierSubmissionNotice(row, publicBaseUrl(req));
      } catch (mailErr) {
        console.error('Atelier notify email failed:', mailErr.message);
      }

      res.json({
        success: true,
        id: row.id,
        message: apiMsg('atelier.success', lang),
      });
    } catch (e) {
      console.error('atelier submit:', e);
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        /* ignore */
      }
      res.status(500).json({ error: apiMsg('atelier.saveFailed', lang) });
    }
  });
});

app.get('/api/admin/atelier', requireAuth, (req, res) => {
  db.all(`SELECT * FROM atelier_submissions ORDER BY createdAt DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.patch('/api/admin/atelier/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'viewed', 'archived'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status' });
  }
  try {
    await dbRun(`UPDATE atelier_submissions SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Update fehlgeschlagen' });
  }
});

app.delete('/api/admin/atelier/:id', requireAuth, async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM atelier_submissions WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Nicht gefunden' });
    const fullPath = path.join(UPLOAD_DIR, row.image_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    await dbRun(`DELETE FROM atelier_submissions WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Löschen fehlgeschlagen' });
  }
});

app.post('/api/admin/upload', requireAuth, (req, res) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload fehlgeschlagen' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei ausgewählt' });
    }
    res.json({
      success: true,
      url: `/uploads/${req.file.filename}`,
    });
  });
});

// ============================================================================
// SITE IMAGES (Galerie & feste Bild-Slots)
// ============================================================================

app.get('/api/site-images', async (req, res) => {
  try {
    const { images, galleryCount } = await siteImages.getPublicImages(dbAll, dbGet);
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.json({ images, galleryCount });
  } catch (e) {
    console.error('site-images public:', e.message);
    const fallback = Object.fromEntries(
      siteImages.SITE_IMAGE_SLOTS.map((s) => [s.slot, s.defaultUrl])
    );
    res.json({ images: fallback, galleryCount: siteImages.DEFAULT_GALLERY_COUNT });
  }
});

app.get('/api/admin/site-images', requireAuth, async (req, res) => {
  try {
    const slots = await siteImages.getAdminSlots(dbAll);
    const galleryCount = await siteImages.getGalleryCount(dbGet);
    res.json({ slots, galleryCount, galleryMax: siteImages.GALLERY_MAX });
  } catch (e) {
    console.error('site-images admin list:', e.message);
    res.status(500).json({ error: 'Bilder konnten nicht geladen werden' });
  }
});

app.put('/api/admin/site-images/gallery-count', requireAuth, async (req, res) => {
  try {
    await contentVersions.snapshotBeforeChange(dbRun, dbGet, dbAll, {
      kind: 'site_images',
      label: `Galerie-Anzahl (${req.body?.galleryCount ?? '?'})`,
      createdBy: req.session.username || null,
      meta: { action: 'gallery_count' },
    });
    const galleryCount = await siteImages.setGalleryCount(dbRun, req.body?.galleryCount);
    res.json({ success: true, galleryCount });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Speichern fehlgeschlagen' });
  }
});

app.put('/api/admin/site-images/:slot', requireAuth, async (req, res) => {
  const { slot } = req.params;
  const { url } = req.body || {};
  try {
    await contentVersions.snapshotBeforeChange(dbRun, dbGet, dbAll, {
      kind: 'site_images',
      label: `Bild: ${slot}`,
      createdBy: req.session.username || null,
      meta: { action: 'set_slot', slot },
    });
    const saved = await siteImages.setSlotUrl(dbGet, dbRun, slot, url, UPLOAD_DIR);
    res.json({ success: true, ...saved });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Speichern fehlgeschlagen' });
  }
});

app.post('/api/admin/site-images/:slot/upload', requireAuth, (req, res) => {
  const { slot } = req.params;
  if (!siteImages.getSlot(slot)) {
    return res.status(404).json({ error: 'Unbekannter Bild-Slot' });
  }

  imageUpload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload fehlgeschlagen' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei ausgewählt' });
    }

    try {
      await contentVersions.snapshotBeforeChange(dbRun, dbGet, dbAll, {
        kind: 'site_images',
        label: `Upload: ${slot}`,
        createdBy: req.session.username || null,
        meta: { action: 'upload', slot },
      });
      const url = `/uploads/${req.file.filename}`;
      const saved = await siteImages.setSlotUrl(dbGet, dbRun, slot, url, UPLOAD_DIR);
      res.json({ success: true, url, ...saved });
    } catch (e) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (_) {
          /* ignore */
        }
      }
      res.status(500).json({ error: e.message || 'Speichern fehlgeschlagen' });
    }
  });
});

app.delete('/api/admin/site-images/:slot', requireAuth, async (req, res) => {
  const { slot } = req.params;
  try {
    await contentVersions.snapshotBeforeChange(dbRun, dbGet, dbAll, {
      kind: 'site_images',
      label: `Zurücksetzen: ${slot}`,
      createdBy: req.session.username || null,
      meta: { action: 'reset', slot },
    });
    const reset = await siteImages.resetSlot(dbGet, dbRun, slot, UPLOAD_DIR);
    res.json({ success: true, ...reset });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Zurücksetzen fehlgeschlagen' });
  }
});

app.get('/api/admin/media', requireAuth, async (req, res) => {
  try {
    const files = await media.listMedia(UPLOAD_DIR, dbAll);
    res.json({ files });
  } catch (e) {
    console.error('admin media list:', e.message);
    res.status(500).json({ error: 'Mediathek konnte nicht geladen werden' });
  }
});

app.post('/api/admin/media/upload', requireAuth, (req, res) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload fehlgeschlagen' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei ausgewählt' });
    }
    res.json({
      success: true,
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
    });
  });
});

app.delete('/api/admin/media/:filename', requireAuth, async (req, res) => {
  const filename = path.basename(req.params.filename || '');
  const url = media.urlFromFilename(filename);
  if (!url) {
    return res.status(400).json({ error: 'Ungültiger Dateiname' });
  }

  try {
    const usageMap = await media.collectUsage(dbAll);
    const usedBy = usageMap.get(url) || [];
    const blocking = usedBy.filter((u) => u.type === 'news' || u.type === 'events');

    if (blocking.length) {
      return res.status(409).json({
        error: 'Bild wird noch in Neuigkeiten oder Veranstaltungen verwendet.',
        usedBy: blocking,
      });
    }

    for (const u of usedBy.filter((item) => item.type === 'site')) {
      await siteImages.resetSlot(dbGet, dbRun, u.ref, UPLOAD_DIR);
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, filename, url });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Löschen fehlgeschlagen' });
  }
});

// ============================================================================
// STATIC ASSET IMAGES (assets/img/) — list + delete
// ============================================================================

const STATIC_IMG_DIR = path.join(ROOT, 'assets', 'img');
const PROTECTED_STATIC = new Set([
  'favicon.svg', 'favicon.ico', 'favicon-32x32.png', 'favicon-16x16.png',
  'apple-touch-icon.png', 'site.webmanifest', 'logo.jpg',
]);
const STATIC_IMG_EXT = /\.(jpe?g|png|gif|webp|svg)$/i;

app.get('/api/admin/static-images', requireAuth, async (req, res) => {
  try {
    const entries = fs.readdirSync(STATIC_IMG_DIR, { withFileTypes: true })
      .filter((d) => d.isFile() && STATIC_IMG_EXT.test(d.name));
    const files = await Promise.all(entries.map(async (d) => {
      const filePath = path.join(STATIC_IMG_DIR, d.name);
      const stat = fs.statSync(filePath);
      return {
        filename: d.name,
        url: `/assets/img/${d.name}`,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
        type: imageMeta.fileType(d.name),
        dimensions: await imageMeta.getDimensions(filePath),
        protected: PROTECTED_STATIC.has(d.name),
      };
    }));
    files.sort((a, b) => a.filename.localeCompare(b.filename));
    res.json({ files });
  } catch (e) {
    res.status(500).json({ error: 'Statische Bilder konnten nicht geladen werden' });
  }
});

app.delete('/api/admin/static-images/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename || '');
  if (!filename || filename.includes('..')) {
    return res.status(400).json({ error: 'Ungültiger Dateiname' });
  }
  if (PROTECTED_STATIC.has(filename)) {
    return res.status(403).json({ error: 'Dieses Bild ist systemgeschützt und kann nicht gelöscht werden.' });
  }
  if (!STATIC_IMG_EXT.test(filename)) {
    return res.status(400).json({ error: 'Nur Bilddateien können gelöscht werden' });
  }
  const filePath = path.join(STATIC_IMG_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Datei nicht gefunden' });
  }
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, filename, url: `/assets/img/${filename}` });
  } catch (e) {
    res.status(500).json({ error: 'Löschen fehlgeschlagen' });
  }
});

// ============================================================================
// I18N TEXT OVERRIDES (Admin → Website)
// ============================================================================

app.get('/api/i18n/overrides', async (req, res) => {
  try {
    const overrides = await i18nContent.readOverrides(dbGet);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(i18nContent.mergeOverridesForPublic(overrides));
  } catch (e) {
    console.error('i18n overrides:', e.message);
    res.json({ de: {}, en: {} });
  }
});

app.get('/api/admin/i18n/catalog', requireAuth, (req, res) => {
  res.json(i18nContent.CATALOG);
});

app.get('/api/admin/i18n/:groupId', requireAuth, async (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'de';
  const groupId = req.params.groupId;
  if (groupId === 'catalog') {
    return res.json(i18nContent.CATALOG);
  }
  if (!i18nContent.CATALOG.some((g) => g.id === groupId)) {
    return res.status(404).json({ error: 'Gruppe nicht gefunden' });
  }
  try {
    const overrides = await i18nContent.readOverrides(dbGet);
    const data = i18nContent.getGroupValues(groupId, lang, overrides);
    res.json({
      groupId,
      lang,
      title: data.group.title,
      description: data.group.description || '',
      fields: data.fields,
    });
  } catch (e) {
    console.error('admin i18n get:', e.message);
    res.status(500).json({ error: 'Texte konnten nicht geladen werden' });
  }
});

app.put('/api/admin/i18n/:groupId', requireAuth, async (req, res) => {
  const groupId = req.params.groupId;
  const { lang, values } = req.body || {};
  const errMsg = i18nContent.validateGroupPayload(groupId, lang, values);
  if (errMsg) return res.status(400).json({ error: errMsg });

  try {
    const group = i18nContent.CATALOG.find((g) => g.id === groupId);
    await contentVersions.snapshotBeforeChange(dbRun, dbGet, dbAll, {
      kind: 'i18n',
      label: `Texte: ${group?.title || groupId} (${lang || 'de'})`,
      createdBy: req.session.username || null,
      meta: { action: 'save', groupId, lang },
    });
    const saved = await i18nContent.saveGroupOverrides(dbGet, dbRun, groupId, lang, values);
    res.json({ success: true, overrides: i18nContent.mergeOverridesForPublic(saved) });
  } catch (e) {
    console.error('admin i18n save:', e.message);
    res.status(500).json({ error: 'Speichern fehlgeschlagen' });
  }
});

app.delete('/api/admin/i18n/:groupId', requireAuth, async (req, res) => {
  const groupId = req.params.groupId;
  const lang = req.query.lang === 'en' ? 'en' : 'de';
  if (!i18nContent.CATALOG.some((g) => g.id === groupId)) {
    return res.status(404).json({ error: 'Gruppe nicht gefunden' });
  }
  try {
    const group = i18nContent.CATALOG.find((g) => g.id === groupId);
    await contentVersions.snapshotBeforeChange(dbRun, dbGet, dbAll, {
      kind: 'i18n',
      label: `Texte zurückgesetzt: ${group?.title || groupId} (${lang})`,
      createdBy: req.session.username || null,
      meta: { action: 'reset', groupId, lang },
    });
    const saved = await i18nContent.resetGroupOverrides(dbGet, dbRun, groupId, lang);
    res.json({ success: true, overrides: i18nContent.mergeOverridesForPublic(saved) });
  } catch (e) {
    console.error('admin i18n reset:', e.message);
    res.status(500).json({ error: 'Zurücksetzen fehlgeschlagen' });
  }
});

// ============================================================================
// CONTENT VERSIONS (Rollback)
// ============================================================================

app.get('/api/admin/content-versions', requireAuth, async (req, res) => {
  try {
    const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
    const versions = await contentVersions.listVersions(dbAll, {
      kind,
      limit: req.query.limit,
    });
    res.json({ versions, kinds: contentVersions.KINDS, maxVersions: contentVersions.MAX_VERSIONS });
  } catch (e) {
    console.error('content-versions list:', e.message);
    res.status(500).json({ error: 'Versionen konnten nicht geladen werden' });
  }
});

app.post('/api/admin/content-versions/snapshot', requireAuth, async (req, res) => {
  try {
    const label = req.body?.label || 'Manueller Sicherungspunkt';
    const id = await contentVersions.createVersion(dbRun, {
      kind: 'content_bundle',
      label,
      snapshot: await contentVersions.captureBundle(dbGet, dbAll),
      createdBy: req.session.username || null,
      meta: { action: 'manual_snapshot' },
    });
    res.json({ success: true, id });
  } catch (e) {
    console.error('content-versions snapshot:', e.message);
    res.status(500).json({ error: e.message || 'Sicherung fehlgeschlagen' });
  }
});

app.post('/api/admin/content-versions/:id/restore', requireAuth, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Ungültige Versions-ID' });
  }
  try {
    const result = await contentVersions.restoreVersion(dbGet, dbRun, dbAll, id, {
      createdBy: req.session.username || null,
    });
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('content-versions restore:', e.message);
    res.status(400).json({ error: e.message || 'Wiederherstellung fehlgeschlagen' });
  }
});

app.get('/api/admin/bookings', requireAuth, (req, res) => {
  db.all(`SELECT * FROM bookings ORDER BY date DESC, start_time DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

app.post('/api/admin/bookings', requireAuth, async (req, res) => {
  const { name, email, phone, date, startTime, message, blockSlot } = req.body;

  if (!date || !startTime || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime)) {
    return res.status(400).json({ error: 'Datum und Uhrzeit erforderlich' });
  }

  const daySlots = booking.generateSlotsForDay(date);
  const slot = daySlots.find((s) => s.start === startTime);
  if (!slot) {
    return res.status(400).json({ error: 'Ungültiger Zeitslot' });
  }

  const isBlock = Boolean(blockSlot);
  const clientName = isBlock ? (name?.trim() || 'Blockiert (Praxis)') : name?.trim();
  const clientEmail = isBlock ? (email?.trim() || 'praxis@kunsttherapie-pb.de') : email?.trim();

  if (!isBlock && (!clientName || !clientEmail)) {
    return res.status(400).json({ error: 'Name und E-Mail erforderlich' });
  }

  try {
    const { localBusy, googleBusy } = await getBusyForRange(date, date);
    const intervals = busyForDate(date, localBusy, googleBusy);
    const available = booking.slotsWithAvailability(date, intervals);
    const chosen = available.find((s) => s.start === startTime);
    if (!chosen || !chosen.available) {
      return res.status(409).json({ error: 'Dieser Zeitslot ist bereits belegt' });
    }

    const result = await dbRun(
      `INSERT INTO bookings (name, email, phone, date, start_time, end_time, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [
        clientName,
        clientEmail,
        phone ? phone.trim() : null,
        date,
        slot.start,
        slot.end,
        isBlock ? (message?.trim() || 'Manuell blockiert') : message?.trim() || null,
      ]
    );

    const row = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [result.lastID]);

    if (!isBlock) {
      await syncGoogleCreate(row);
    }

    res.json({
      success: true,
      id: row.id,
      message: isBlock ? 'Zeitslot blockiert' : 'Termin eingetragen',
    });
  } catch (e) {
    console.error('admin booking create:', e);
    res.status(500).json({ error: 'Termin konnte nicht gespeichert werden' });
  }
});

app.patch('/api/admin/bookings/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Ungültiger Status' });
  }

  try {
    const row = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Nicht gefunden' });

    await dbRun(`UPDATE bookings SET status = ? WHERE id = ?`, [status, req.params.id]);
    const updated = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [req.params.id]);

    if (status === 'confirmed' && row.status !== 'confirmed') {
      const baseUrl = publicBaseUrl(req);
      try {
        await email.sendBookingEmails(updated, baseUrl);
      } catch (mailErr) {
        console.error('Booking confirmation email failed:', mailErr.message);
      }

      if (!updated.google_event_id) {
        await syncGoogleCreate(updated);
      }
    }

    if (status === 'cancelled' && row.google_event_id) {
      await syncGoogleDelete(row.google_event_id);
    }

    res.json({
      success: true,
      message:
        status === 'confirmed' && row.status !== 'confirmed'
          ? 'Termin bestätigt – Bestätigungs-E-Mail wurde versendet.'
          : 'Buchung aktualisiert',
    });
  } catch (e) {
    res.status(500).json({ error: 'Update fehlgeschlagen' });
  }
});

app.delete('/api/admin/bookings/:id', requireAuth, async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Nicht gefunden' });

    if (row.google_event_id) {
      await syncGoogleDelete(row.google_event_id);
    }

    await dbRun(`DELETE FROM bookings WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Buchung gelöscht' });
  } catch (e) {
    res.status(500).json({ error: 'Löschen fehlgeschlagen' });
  }
});

app.get('/api/admin/google/status', requireAuth, (req, res) => {
  const hasClient = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  getGoogleRefreshToken((err, token) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({
      clientConfigured: hasClient,
      connected: Boolean(token),
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      authUrl: hasClient && !token ? googleCalendar.getAuthUrl() : null,
    });
  });
});

app.get('/api/admin/google/auth', requireAuth, (req, res) => {
  const url = googleCalendar.getAuthUrl();
  if (!url) {
    return res.status(400).json({
      error: 'GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET in .env eintragen',
    });
  }
  res.json({ url });
});

app.get('/api/admin/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    return res.status(400).send(`<p>Google-Verbindung abgebrochen: ${error}</p>`);
  }
  if (!code) {
    return res.status(400).send('<p>Kein Autorisierungscode erhalten.</p>');
  }

  try {
    const refreshToken = await googleCalendar.getRefreshTokenFromCode(code);
    if (!refreshToken) {
      return res.status(400).send(
        '<p>Kein Refresh-Token erhalten. Bitte erneut verbinden und „Zugriff erlauben“ bestätigen.</p>'
      );
    }

    await new Promise((resolve, reject) => {
      saveGoogleRefreshToken(refreshToken, (err) => (err ? reject(err) : resolve()));
    });

    res.send(`
      <!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Google Kalender verbunden</title></head>
      <body style="font-family:sans-serif;max-width:640px;margin:40px auto;padding:20px">
        <h1>Google Kalender verbunden</h1>
        <p>Der Kalender ist jetzt mit der Website verknüpft. Termine aus Google blockieren freie Slots; neue Buchungen erscheinen im Kalender.</p>
        <p>Optional für Hostinger in der <code>.env</code> sichern:</p>
        <pre style="background:#f4f4f4;padding:12px;overflow:auto">GOOGLE_REFRESH_TOKEN=${refreshToken}</pre>
        <p><a href="/admin">Zurück zum Admin-Panel</a></p>
      </body></html>
    `);
  } catch (e) {
    console.error('Google callback error:', e);
    res.status(500).send('<p>Verbindung fehlgeschlagen. Bitte Einstellungen prüfen.</p>');
  }
});

// ============================================================================
// FRONTEND ROUTES (fixes "Cannot GET /" on Hostinger Node redeploy)
// ============================================================================

const SITE_PAGES = [
  'index',
  'kunsttherapie',
  'ueber-mich',
  'neuigkeiten',
  'events',
  'preise',
  'kontakt',
  'buchung',
  'atelier',
  'impressum',
  'datenschutz'
];

function sendPage(res, name) {
  const file = path.join(ROOT, `${name}.html`);
  if (!fs.existsSync(file)) {
    return res.status(404).send('Seite nicht gefunden');
  }
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  return res.sendFile(file);
}

app.get('/robots.txt', (req, res) => {
  const file = path.join(ROOT, 'robots.txt');
  if (fs.existsSync(file)) return res.type('text/plain').sendFile(file);
  res.type('text/plain').send('User-agent: *\nAllow: /\n');
});

app.get('/sitemap.xml', (req, res) => {
  const file = path.join(ROOT, 'sitemap.xml');
  if (fs.existsSync(file)) return res.type('application/xml').sendFile(file);
  res.status(404).send('Not found');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kunsttherapie-cms', lastBackup: backup.getLastBackup() });
});

app.get('/', (req, res) => sendPage(res, 'index'));
app.get('/index.html', (req, res) => res.redirect(301, '/'));

app.get('/admin', (req, res) => {
  const adminFile = path.join(PUBLIC_DIR, 'admin.html');
  const fallback = path.join(ROOT, 'admin.html');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(fs.existsSync(adminFile) ? adminFile : fallback);
});

app.get('/admin.html', (req, res) => res.redirect(301, '/admin'));

SITE_PAGES.forEach((page) => {
  if (page === 'index') return;
  app.get(`/${page}`, (req, res) => sendPage(res, page));
  app.get(`/${page}.html`, (req, res) => res.redirect(301, `/${page}`));
});

app.get('/angebote', (req, res) => res.redirect(301, '/kunsttherapie'));
app.get('/angebote.html', (req, res) => res.redirect(301, '/kunsttherapie'));

// PDFs and images in project root (Lebenslauf, etc.)
app.get(/\.(pdf|jpg|jpeg|png|gif|webp|svg)$/i, (req, res, next) => {
  const file = path.join(ROOT, path.basename(req.path));
  if (fs.existsSync(file)) {
    res.setHeader('Cache-Control', `public, max-age=${365 * 24 * 60 * 60}, immutable`);
    return res.sendFile(file);
  }
  next();
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Nicht gefunden' });
  }
  const page404 = path.join(ROOT, '404.html');
  if (fs.existsSync(page404)) {
    return res.status(404).sendFile(page404);
  }
  res.status(404).type('text/html; charset=utf-8').send(
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Seite nicht gefunden</title></head><body><p>Seite nicht gefunden.</p><p><a href="/">Zur Startseite</a></p></body></html>'
  );
});

// Globaler Fehler-Handler: saubere Antwort, keine Stacktraces nach außen
app.use((err, req, res, next) => {
  console.error('Unbehandelter Request-Fehler:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  if (req.path && req.path.startsWith('/api/')) {
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
  res.status(500).type('text/html; charset=utf-8').send(
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Fehler</title></head><body><p>Es ist ein Fehler aufgetreten.</p><p><a href="/">Zur Startseite</a></p></body></html>'
  );
});

// ============================================================================
// SERVER START
// ============================================================================

if (require.main === module) {
// Prozess-Stabilität: einzelne Fehler dürfen den Server nicht lautlos beenden
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
});

app.listen(PORT, async () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   Kunsttherapie CMS Backend       ║`);
  console.log(`║  Server running on http://localhost:${PORT}      ║`);
  console.log(`║  Admin Panel: http://localhost:${PORT}/admin  ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
  try {
    await dbReady;
    const cleaned = await i18nContent.migrateRentedOverrides(dbGet, dbRun);
    if (cleaned) console.log('i18n: veraltete CMS-Texte (Miet-/Über-mich-Doppelüberschrift) bereinigt');
    const seeded = await i18nContent.seedOverridesFromFile(dbGet, dbRun);
    if (seeded) console.log('i18n: Texte aus data/i18n-overrides.json in die Datenbank übernommen');
    await i18nContent.syncI18nFromSource(dbGet);
    console.log('i18n: Übersetzungsdateien aus Quelltexten neu aufgebaut');
  } catch (e) {
    console.error('i18n migrate:', e.message);
  }
  try {
    await dbReady;
    backup.scheduleBackups(db, DB_PATH, { keep: 7 });
  } catch (e) {
    console.error('Backup-Scheduling fehlgeschlagen:', e.message);
  }
});
}

module.exports = app;
