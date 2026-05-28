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
const ROOT_DIR = __dirname;
const PUBLIC_SITE_FILES = new Set([
  'index.html',
  'angebote.html',
  'ueber-mich.html',
  'preise.html',
  'kontakt.html',
  'neuigkeiten.html',
  'events.html',
  'impressum.html',
  'datenschutz.html',
  'style.css',
  'main.js',
  'Bilder.jpg',
  'Gruppen-und-Einzeltherapie-768x524.jpg',
  'Potenziale-Kunsttherapie-Paderborn.jpg',
  'Screenshot_2026-05-21_104753.jpg',
  'Sonnige_Pinsel.jpg',
  'logo.jpg'
]);

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'kunsttherapie-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
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
// SERVER START
// ============================================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'admin.html'));
});

app.get('/:file', (req, res, next) => {
  const requestedFile = req.params.file;

  if (!PUBLIC_SITE_FILES.has(requestedFile)) {
    return next();
  }

  res.sendFile(path.join(ROOT_DIR, requestedFile));
});

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  🎨 Kunsttherapie CMS Backend       ║`);
  console.log(`║  Server running on http://localhost:${PORT}      ║`);
  console.log(`║  Admin Panel: http://localhost:${PORT}/admin  ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});

module.exports = app;
