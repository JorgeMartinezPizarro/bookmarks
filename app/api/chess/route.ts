import { errorMessage } from "@/app/helpers";
import { Chess } from "chess.js";

const isValidFEN = (fen: string) => {
  try {
    const game = new Chess(fen); // Intenta cargar el FEN
    return "";
  } catch (error) {
    return errorMessage(error);
  }
};

export async function POST(req: Request): Promise<Response> {
  // La URL correcta para Stockfish, basada en tu configuración de Nginx
  const STOCKFISH_API_URL = "https://nube.ideniox.com/chess";

  try {
    // Parseamos los datos del cuerpo de la solicitud
    const params = await req.json();
    const { fen } = params;

    if (!fen) {
      return Response.json({ error: "FEN position is required" }, { status: 400 });
    }

    const cleanFEN = fen.trim().replace(/\s+/g, ' ');

    const validateFEN = isValidFEN(cleanFEN)

    if (validateFEN !== "") {
      throw new Error("FEN inválido: " + cleanFEN + ", error: " + validateFEN);
    }
    const elo = 1800
    // Formato UCI correcto
    const payload = `uci
setoption name UCI_LimitStrength value true
setoption name UCI_Elo value ${elo}
isready
position fen ${cleanFEN}
go movetime 3000
`.trim();

    console.log("Payload limpio enviado a Stockfish:", JSON.stringify(payload));
    // Enviamos el comando al servidor Flask
    const response = await fetch(STOCKFISH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: payload,
    });
    

    //console.log(response, "cojones!")

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en Stockfish API: ${response.status}`);
      throw new Error(`Stockfish API error: ${response.status}: ${errorText}`);
    }

    // Procesamos la respuesta del servidor Flask
    const t = await response.json();
    const { response: stockfishResponse } = t
    console.log("Respuesta preliminar de Stockfish:", stockfishResponse);

    // Extraemos el mejor movimiento de la respuesta de Stockfish
    const bestMoveLine = stockfishResponse.find((line: string) => line.startsWith("bestmove"));
    if (!bestMoveLine) {
      throw new Error(`No se encontró 'bestmove' en la respuesta de Stockfish: ${stockfishResponse}`);
    }
    const match = bestMoveLine.match(/bestmove\s(\S+)/);

    const bestmove = match[1];
    return Response.json({ bestmove, request: payload, response: stockfishResponse }, { status: 200 });
  } catch (error) {
    console.error("Error en /bookmarks/api/chess:", error);
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
