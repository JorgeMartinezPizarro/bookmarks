import { errorMessage } from "@/app/helpers";
import { requireAuth } from "@/app/lib/auth";
import { NextRequest } from "next/server";
import Database from 'better-sqlite3';

// Inicializar conexión a la base de datos
const db = new Database('scores.db');

// Crear tabla si no existe
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

// Crear índices para mejorar el rendimiento de las consultas
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_gameId ON scores(gameId);
  CREATE INDEX IF NOT EXISTS idx_gameId_score ON scores(gameId, score DESC);
`);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    await requireAuth(request);
    const params = await request.json();
    const { gameId, username, score, gameConfig } = params;

    // Validar parámetros requeridos
    if (!gameId || !username || score === undefined) {
      return Response.json(
        { error: "gameId, username and score are required." },
        { status: 400 }
      );
    }

    // Insertar el puntaje en la base de datos
    const insertStmt = db.prepare(`
      INSERT INTO scores (gameId, username, score, gameConfig)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      Number(gameId),
      username,
      Number(score),
      gameConfig ? JSON.stringify(gameConfig) : null
    );

    return Response.json(
      { 
        message: "Score saved successfully.",
        id: result.lastInsertRowid 
      }, 
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: errorMessage(error) }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    if (!gameId) {
      return Response.json(
        { error: "gameId is required." },
        { status: 400 }
      );
    }

    await requireAuth(request);

    // Obtener los 100 mejores puntajes para el gameId especificado
    const selectStmt = db.prepare(`
      SELECT username, score, gameConfig, createdAt
      FROM scores
      WHERE gameId = ?
      ORDER BY score DESC
      LIMIT 100
    `);

    const scores = selectStmt.all(Number(gameId));

    return Response.json(
      { 
        gameId: Number(gameId),
        total: scores.length,
        scores: scores.map((s: any) => ({
          ...s,
          gameConfig: s.gameConfig ? JSON.parse(s.gameConfig) : null
        }))
      }, 
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: errorMessage(error) }, 
      { status: 500 }
    );
  }
}