const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcryptjs = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');

// Ensure upload directory exists (Hostinger redeploy may wipe empty dirs)
fs.mkdirSync(path.join(PUBLIC_DIR, 'uploads'), { recursive: true });

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
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ============================================================================
// DATENBANK SETUP
// ============================================================================

const db = new sqlite3.Database('./database.sqlite', (err) => {
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

  // Create default admin if not exists
  db.get(`SELECT * FROM admins WHERE username = ?`, ['admin'], (err, row) => {
    if (!row) {
      const hashedPassword = bcryptjs.hashSync('admin123', 10);
      db.run(
        `INSERT INTO admins (username, password, email) VALUES (?, ?, ?)`,
        ['admin', hashedPassword, 'info@kunsttherapie-pb.de'],
        (err) => {
          if (err) {
            console.error('Error creating default admin:', err);
          } else {
            console.log('✅ Default admin created (username: admin, password: admin123)');
            console.log('⚠️  WICHTIG: Bitte Passwort nach dem ersten Login ändern!');
          }
        }
      );
    }
  });

  console.log('✅ Database initialized');
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
// FRONTEND ROUTES (fixes "Cannot GET /" on Hostinger Node redeploy)
// ============================================================================

const SITE_PAGES = [
  'index',
  'angebote',
  'ueber-mich',
  'neuigkeiten',
  'events',
  'preise',
  'kontakt',
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

SITE_PAGES.forEach((page) => {
  if (page === 'index') return;
  app.get(`/${page}`, (req, res) => sendPage(res, page));
  app.get(`/${page}.html`, (req, res) => sendPage(res, page));
});

// PDFs and images in project root (Lebenslauf, etc.)
app.get(/\.(pdf|jpg|jpeg|png|gif|webp)$/i, (req, res, next) => {
  const file = path.join(ROOT, path.basename(req.path));
  if (fs.existsSync(file)) {
    return res.sendFile(file);
  }
  next();
});

// ============================================================================
// SERVER START
// ============================================================================

if (require.main === module) {
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  🎨 Kunsttherapie CMS Backend       ║`);
  console.log(`║  Server running on http://localhost:${PORT}      ║`);
  console.log(`║  Admin Panel: http://localhost:${PORT}/admin  ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});
}

module.exports = app;
