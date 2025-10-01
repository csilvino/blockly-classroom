
import Database from 'better-sqlite3';
import { config } from './config.js';

export const db = new Database(config.DATABASE_FILE);
db.pragma('journal_mode = WAL');

// Migrations (idempotentes)
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('TEACHER','STUDENT')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  ageRange TEXT,
  toolboxPreset TEXT,
  customToolboxXml TEXT,
  startingXml TEXT,
  expectedType TEXT, -- 'OUTPUT_MATCH' | 'CUSTOM_VALIDATOR'
  expectedData TEXT, -- JSON: {"lines":[...]} ou {"validatorJs":"..."}
  createdBy INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(createdBy) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'MAZE' | 'CHARACTER'
  config TEXT NOT NULL, -- JSON
  createdBy INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(createdBy) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lessonId INTEGER NOT NULL,
  scenarioId INTEGER NOT NULL,
  requiredBlocks TEXT, -- JSON array
  orderIndex INTEGER DEFAULT 0,
  isPublished INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(lessonId) REFERENCES lessons(id),
  FOREIGN KEY(scenarioId) REFERENCES scenarios(id)
);

CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL,
  challengeId INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED | IN_PROGRESS | COMPLETED
  attempts INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0,
  lastOutput TEXT,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(studentId, challengeId),
  FOREIGN KEY(studentId) REFERENCES users(id),
  FOREIGN KEY(challengeId) REFERENCES challenges(id)
);

CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL,
  badge TEXT NOT NULL,
  reason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(studentId) REFERENCES users(id)
);
`);
