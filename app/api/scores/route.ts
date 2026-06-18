import { requireAuth, type AuthUser } from "@/app/lib/auth";
import { getScoresForGame, insertScore } from "@/app/lib/scores/db";
import {
  GetScoresResponse,
  SaveScoreResponse,
  ScoresErrorResponse,
  getErrorResponseMessage,
  getErrorStatus,
  parseGameIdBody,
  parseGameIdParam,
  parseScoreValue,
  serializeGameConfig,
} from "@/app/lib/scores/types";
import { NextRequest } from "next/server";

function errorResponse(error: unknown): Response {
  const body: ScoresErrorResponse = { error: getErrorResponseMessage(error) };
  return Response.json(body, { status: getErrorStatus(error) });
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
	
    const user: AuthUser = process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true"
      ? await requireAuth(request)
      : { id: "anonymous", name: "anonymous", email: "" };	

    const params = await request.json();
    const { gameId, score, gameConfig } = params;

    const parsedGameId = parseGameIdBody(gameId);
    if (parsedGameId === null) {
      return Response.json(
        { error: "gameId must be a valid game identifier (1-4)." },
        { status: 400 }
      );
    }

    const parsedScore = parseScoreValue(score);
    if (parsedScore === null) {
      return Response.json(
        { error: "score is required and must be a number." },
        { status: 400 }
      );
    }

    const serializedConfig = serializeGameConfig(gameConfig);
    if (!serializedConfig.ok) {
      return Response.json({ error: serializedConfig.error }, { status: 400 });
    }

    const id = insertScore(user, parsedGameId, parsedScore, serializedConfig.value);

    const body: SaveScoreResponse = {
      message: "Score saved successfully.",
      id,
    };

    return Response.json(body, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const parsedGameId = parseGameIdParam(searchParams.get("gameId"));

    if (parsedGameId === null) {
      return Response.json(
        { error: "gameId is required and must be a valid game identifier (1-4)." },
        { status: 400 }
      );
    }

    if (process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true")
		await requireAuth(request);

    
    const body: GetScoresResponse = {
      gameId: parsedGameId,
      total: 0,
      scores: getScoresForGame(parsedGameId),
    };
    body.total = body.scores.length;

    return Response.json(body, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
