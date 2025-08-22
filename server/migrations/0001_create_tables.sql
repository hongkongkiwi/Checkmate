-- Migration 0001: Create initial tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  firstName TEXT,
  lastName TEXT,
  email TEXT UNIQUE,
  password TEXT,
  avatarImage TEXT,
  profileImage BLOB,
  profileImageContentType TEXT,
  isActive BOOLEAN DEFAULT 1,
  isVerified BOOLEAN DEFAULT 0,
  role TEXT,
  teamId TEXT,
  checkTTL INTEGER,
  createdAt TEXT,
  updatedAt TEXT
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

-- Monitors table
CREATE TABLE IF NOT EXISTS monitors (
  id TEXT PRIMARY KEY,
  userId TEXT,
  teamId TEXT,
  name TEXT,
  description TEXT,
  status BOOLEAN,
  statusWindow TEXT, -- JSON array
  statusWindowSize INTEGER DEFAULT 5,
  statusWindowThreshold REAL DEFAULT 0.6,
  type TEXT,
  ignoreTlsErrors BOOLEAN DEFAULT 0,
  jsonPath TEXT,
  expectedValue TEXT,
  matchMethod TEXT,
  url TEXT,
  port INTEGER,
  isActive BOOLEAN DEFAULT 1,
  interval INTEGER DEFAULT 60000,
  uptimePercentage REAL,
  notifications TEXT, -- JSON array of notification IDs
  secret TEXT,
  thresholds TEXT, -- JSON object
  alertThreshold INTEGER DEFAULT 5,
  cpuAlertThreshold INTEGER,
  memoryAlertThreshold INTEGER,
  diskAlertThreshold INTEGER,
  tempAlertThreshold INTEGER,
  gameId TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

-- Checks table
CREATE TABLE IF NOT EXISTS checks (
  id TEXT PRIMARY KEY,
  monitorId TEXT,
  teamId TEXT,
  type TEXT,
  status BOOLEAN,
  responseTime INTEGER,
  timings TEXT, -- JSON object
  statusCode INTEGER,
  message TEXT,
  expiry TEXT,
  ack BOOLEAN DEFAULT 0,
  ackAt TEXT,
  cpu TEXT, -- JSON object
  memory TEXT, -- JSON object
  disk TEXT, -- JSON array
  host TEXT, -- JSON object
  errors TEXT, -- JSON array
  capture TEXT, -- JSON object
  net TEXT, -- JSON array
  accessibility INTEGER,
  bestPractices INTEGER,
  seo INTEGER,
  performance INTEGER,
  audits TEXT, -- JSON object
  createdAt TEXT,
  updatedAt TEXT
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT,
  teamId TEXT,
  name TEXT,
  type TEXT,
  enabled BOOLEAN DEFAULT 1,
  "settings" TEXT, -- JSON object (quoted because it's a reserved word)
  createdAt TEXT,
  updatedAt TEXT
);

-- Invite tokens table
CREATE TABLE IF NOT EXISTS invite_tokens (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE,
  teamId TEXT,
  email TEXT,
  role TEXT,
  expiresAt TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

-- Maintenance windows table
CREATE TABLE IF NOT EXISTS maintenance_windows (
  id TEXT PRIMARY KEY,
  teamId TEXT,
  monitorId TEXT,
  name TEXT,
  description TEXT,
  start TEXT,
  end TEXT,
  expiry TEXT,
  repeat TEXT,
  oneTime BOOLEAN DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

-- Status pages table
CREATE TABLE IF NOT EXISTS status_pages (
  id TEXT PRIMARY KEY,
  teamId TEXT,
  title TEXT,
  description TEXT,
  monitors TEXT, -- JSON array
  showCharts BOOLEAN DEFAULT 1,
  showUptimePercentage BOOLEAN DEFAULT 1,
  showIncidents BOOLEAN DEFAULT 1,
  theme TEXT DEFAULT 'light',
  customCSS TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checks_monitorId ON checks(monitorId);
CREATE INDEX IF NOT EXISTS idx_checks_createdAt ON checks(createdAt);
CREATE INDEX IF NOT EXISTS idx_checks_updatedAt ON checks(updatedAt);
CREATE INDEX IF NOT EXISTS idx_monitors_userId ON monitors(userId);
CREATE INDEX IF NOT EXISTS idx_monitors_teamId ON monitors(teamId);
CREATE INDEX IF NOT EXISTS idx_monitors_type ON monitors(type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_teamId ON users(teamId);
CREATE INDEX IF NOT EXISTS idx_notifications_teamId ON notifications(teamId);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_maintenance_windows_teamId ON maintenance_windows(teamId);
CREATE INDEX IF NOT EXISTS idx_maintenance_windows_monitorId ON maintenance_windows(monitorId);
CREATE INDEX IF NOT EXISTS idx_status_pages_teamId ON status_pages(teamId);