import type { AuthUser } from "@/app/lib/auth";
import type { GameId, ScoreEntry } from "@/app/lib/scores/types";
import { parseStoredGameConfig } from "@/app/lib/scores/types";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = path.join(process.cwd(), "cache/database/scores.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gameId INTEGER NOT NULL,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      gameConfig TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const scoreColumns = db
    .prepare("PRAGMA table_info(scores)")
    .all() as { name: string }[];

  if (!scoreColumns.some((column) => column.name === "userId")) {
    db.exec(`ALTER TABLE scores ADD COLUMN userId TEXT REFERENCES users(id)`);
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_gameId ON scores(gameId);
    CREATE INDEX IF NOT EXISTS idx_gameId_score ON scores(gameId, score DESC);
    CREATE INDEX IF NOT EXISTS idx_scores_userId ON scores(userId);
  `);

  _db = db;
  return db;
}

type ScoreRow = {
  username: string;
  score: number;
  gameConfig: string | null;
  createdAt: string;
};

// Statements preparados de forma perezosa también, reusando getDb()
function getStmts(db: Database.Database) {
  return {
    upsertUser: db.prepare(`
      INSERT INTO users (id, name, email, updatedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        updatedAt = CURRENT_TIMESTAMP
    `),
    insertScore: db.prepare(`
      INSERT INTO scores (gameId, userId, username, score, gameConfig)
      VALUES (?, ?, ?, ?, ?)
    `),
    selectScores: db.prepare(`
      SELECT COALESCE(u.name, s.username) AS username, s.score, s.gameConfig, s.createdAt
      FROM scores s
      LEFT JOIN users u ON s.userId = u.id
      WHERE s.gameId = ?
      ORDER BY s.score DESC
      LIMIT 100
    `),
  };
}

let _stmts: ReturnType<typeof getStmts> | null = null;
function getPreparedStmts() {
  if (!_stmts) {
    _stmts = getStmts(getDb());
  }
  return _stmts;
}

export function ensureUser(user: AuthUser): AuthUser {
  getPreparedStmts().upsertUser.run(user.id, user.name, user.email);
  return user;
}

export function insertScore(
  user: AuthUser,
  gameId: GameId,
  score: number,
  gameConfig: string | null
): number {
  ensureUser(user);

  const result = getPreparedStmts().insertScore.run(
    gameId,
    user.id,
    user.name,
    score,
    gameConfig
  );

  return Number(result.lastInsertRowid);
}

export function getScoresForGame(gameId: GameId): ScoreEntry[] {
  const rows = getPreparedStmts().selectScores.all(gameId) as ScoreRow[];

  return rows.map((row) => ({
    username: row.username,
    score: row.score,
    gameConfig: parseStoredGameConfig(row.gameConfig),
    createdAt: row.createdAt,
  }));
}