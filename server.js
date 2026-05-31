const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_PATH = process.env.DATABASE_PATH || path.join(ROOT, 'database.sqlite');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Hostinger / reverse proxy: HTTPS erkennen, damit Session-Cookies gesetzt werden
if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

// Ensure upload directory exists (Hostinger redeploy may wipe empty dirs)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(PUBLIC_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
    },
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilder (JPG, PNG, GIF, WebP)'));
    }
  },
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
app.use(cors(corsOrigins.length ? { origin: corsOrigins, credentials: true } : undefined));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static: admin panel, uploads, assets (css/js/img)
app.use('/assets', express.static(path.join(ROOT, 'assets')));
app.use(express.static(PUBLIC_DIR));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'kunsttherapie-secret-key-change-in-production',
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

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Admin Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // News Table
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

  // Events Table
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

  // App settings (e.g. Google refresh token from OAuth)
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Bookings (Terminbuchung)
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

  // Services Table
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

  ensureAdminAccounts();
  console.log(' Database initialized');
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
    if (err || (row && row.count > 0)) return;

    const hashedPassword = bcryptjs.hashSync('admin123', 10);
    db.run(
      `INSERT INTO admins (username, password, email) VALUES (?, ?, ?)`,
      ['admin', hashedPassword, envEmail],
      (insertErr) => {
        if (insertErr) {
          console.error('Error creating default admin:', insertErr);
        } else {
          console.log(' Standard-Admin angelegt: Benutzername admin, Passwort admin123');
          console.log('  Bitte ADMIN_USERNAME und ADMIN_PASSWORD in .env setzen!');
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
app.post('/api/auth/login', (req, res) => {
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

      req.session.userId = admin.id;
      req.session.username = admin.username;

      res.json({
        success: true,
        message: 'Logged in successfully',
        username: admin.username
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
        req.session.userId = this.lastID;
        req.session.username = username;
        res.json({
          success: true,
          message: 'Admin-Konto erstellt. Du bist jetzt angemeldet.',
          username,
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
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, message: 'News updated successfully' });
    }
  );
});

// Delete news (admin)
app.delete('/api/admin/news/:id', requireAuth, (req, res) => {
  db.run(
    `DELETE FROM news WHERE id = ?`,
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
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
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, message: 'Event updated successfully' });
    }
  );
});

// Delete event (admin)
app.delete('/api/admin/events/:id', requireAuth, (req, res) => {
  db.run(
    `DELETE FROM events WHERE id = ?`,
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
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
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true, message: 'Service updated successfully' });
    }
  );
});

// Delete service (admin)
app.delete('/api/admin/services/:id', requireAuth, (req, res) => {
  db.run(
    `DELETE FROM services WHERE id = ?`,
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
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

app.post('/api/contact', async (req, res) => {
  const { name, email: fromEmail, phone, message } = req.body;

  if (!name || !fromEmail || !message) {
    return res.status(400).json({ error: 'Name, E-Mail und Nachricht sind erforderlich' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
  }

  try {
    const result = await email.sendContactMessage({
      name: name.trim(),
      email: fromEmail.trim(),
      phone: phone ? phone.trim() : '',
      message: message.trim(),
    });

    if (!result.sent) {
      return res.status(503).json({
        error:
          'Nachricht konnte nicht per E-Mail versendet werden. Bitte ruf uns an oder schreib direkt an info@kunsttherapie-pb.de.',
      });
    }

    res.json({
      success: true,
      message: 'Danke! Deine Nachricht ist angekommen – wir melden uns zeitnah.',
    });
  } catch (e) {
    console.error('contact error:', e);
    res.status(500).json({ error: 'Nachricht konnte nicht gesendet werden' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { name, email, phone, date, startTime, message } = req.body;

  if (!name || !email || !date || !startTime) {
    return res.status(400).json({ error: 'Name, E-Mail, Datum und Uhrzeit sind erforderlich' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime)) {
    return res.status(400).json({ error: 'Ungültiges Datum oder Uhrzeit' });
  }
  if (!booking.isWorkingDay(date)) {
    return res.status(400).json({ error: 'An diesem Tag sind keine Termine möglich' });
  }
  if (booking.isSlotInPast(date, startTime)) {
    return res.status(400).json({ error: 'Dieser Termin liegt zu nah in der Vergangenheit' });
  }

  const daySlots = booking.generateSlotsForDay(date);
  const slot = daySlots.find((s) => s.start === startTime);
  if (!slot) {
    return res.status(400).json({ error: 'Ungültiger Termin-Slot' });
  }

  try {
    const { localBusy, googleBusy } = await getBusyForRange(date, date);
    const intervals = busyForDate(date, localBusy, googleBusy);
    const available = booking.slotsWithAvailability(date, intervals);
    const chosen = available.find((s) => s.start === startTime);
    if (!chosen || !chosen.available) {
      return res.status(409).json({ error: 'Dieser Termin ist leider nicht mehr verfügbar' });
    }

    const result = await dbRun(
      `INSERT INTO bookings (name, email, phone, date, start_time, end_time, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [name.trim(), email.trim(), phone ? phone.trim() : null, date, slot.start, slot.end, message ? message.trim() : null]
    );

    const row = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [result.lastID]);
    const baseUrl = publicBaseUrl(req);
    const calendarLinks = ical.buildCalendarLinks(row, baseUrl);

    let emailSent = false;
    try {
      const emailResult = await email.sendBookingEmails(row, baseUrl);
      emailSent = Boolean(emailResult.sent);
    } catch (mailErr) {
      console.error('Booking email failed:', mailErr.message);
    }

    getGoogleRefreshToken(async (err, token) => {
      if (!err && token) {
        try {
          const googleEventId = await googleCalendar.createCalendarEvent(token, row);
          if (googleEventId) {
            await dbRun(`UPDATE bookings SET google_event_id = ? WHERE id = ?`, [
              googleEventId,
              row.id,
            ]);
          }
        } catch (e) {
          console.error('Google event create failed:', e.message);
        }
      }
    });

    res.json({
      success: true,
      id: row.id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      calendarLinks,
      emailSent,
      message: emailSent
        ? 'Termin bestätigt! Du erhältst in Kürze eine E-Mail – darin kannst du den Termin in Apple- oder Google-Kalender speichern.'
        : 'Termin gespeichert! Füge ihn über die Kalender-Buttons unten in Apple oder Google ein.',
    });
  } catch (e) {
    console.error('booking create error:', e);
    res.status(500).json({ error: 'Buchung fehlgeschlagen' });
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
      getGoogleRefreshToken(async (err, token) => {
        if (!err && token) {
          try {
            const googleEventId = await googleCalendar.createCalendarEvent(token, row);
            if (googleEventId) {
              await dbRun(`UPDATE bookings SET google_event_id = ? WHERE id = ?`, [googleEventId, row.id]);
            }
          } catch (e) {
            console.error('Google event create failed:', e.message);
          }
        }
      });
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

    if (status === 'cancelled' && row.google_event_id) {
      getGoogleRefreshToken(async (err, token) => {
        if (!err && token) {
          try {
            await googleCalendar.deleteCalendarEvent(token, row.google_event_id);
          } catch (e) {
            console.error('Google delete failed:', e.message);
          }
        }
      });
    }

    res.json({ success: true, message: 'Buchung aktualisiert' });
  } catch (e) {
    res.status(500).json({ error: 'Update fehlgeschlagen' });
  }
});

app.delete('/api/admin/bookings/:id', requireAuth, async (req, res) => {
  try {
    const row = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Nicht gefunden' });

    if (row.google_event_id) {
      getGoogleRefreshToken(async (err, token) => {
        if (!err && token) {
          try {
            await googleCalendar.deleteCalendarEvent(token, row.google_event_id);
          } catch (e) {
            console.error('Google delete failed:', e.message);
          }
        }
      });
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
  'angebote',
  'ueber-mich',
  'neuigkeiten',
  'events',
  'preise',
  'kontakt',
  'buchung',
  'impressum',
  'datenschutz'
];

function sendPage(res, name) {
  const file = path.join(ROOT, `${name}.html`);
  if (!fs.existsSync(file)) {
    return res.status(404).send('Seite nicht gefunden');
  }
  return res.sendFile(file);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kunsttherapie-cms' });
});

app.get('/', (req, res) => sendPage(res, 'index'));
app.get('/index.html', (req, res) => res.redirect(301, '/'));

app.get('/admin', (req, res) => {
  const adminFile = path.join(PUBLIC_DIR, 'admin.html');
  const fallback = path.join(ROOT, 'admin.html');
  res.sendFile(fs.existsSync(adminFile) ? adminFile : fallback);
});

app.get('/admin.html', (req, res) => res.redirect(301, '/admin'));

SITE_PAGES.forEach((page) => {
  if (page === 'index') return;
  app.get(`/${page}`, (req, res) => sendPage(res, page));
  app.get(`/${page}.html`, (req, res) => sendPage(res, page));
});

app.get('/angebote', (req, res) => res.redirect(301, '/kunsttherapie'));
app.get('/angebote.html', (req, res) => res.redirect(301, '/kunsttherapie'));

// PDFs and images in project root (Lebenslauf, etc.)
app.get(/\.(pdf|jpg|jpeg|png|gif|webp)$/i, (req, res, next) => {
  const file = path.join(ROOT, path.basename(req.path));
  if (fs.existsSync(file)) {
    return res.sendFile(file);
  }
  next();
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Nicht gefunden' });
  }
  res.status(404).type('text/html; charset=utf-8').send(
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Seite nicht gefunden</title></head><body><p>Seite nicht gefunden.</p><p><a href="/">Zur Startseite</a></p></body></html>'
  );
});

// ============================================================================
// SERVER START
// ============================================================================

if (require.main === module) {
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   Kunsttherapie CMS Backend       ║`);
  console.log(`║  Server running on http://localhost:${PORT}      ║`);
  console.log(`║  Admin Panel: http://localhost:${PORT}/admin  ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});
}

module.exports = app;
