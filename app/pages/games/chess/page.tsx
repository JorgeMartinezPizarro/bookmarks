"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button, Tooltip, TextField, Typography, Box, Slider } from "@mui/material";
import { Chess } from "chess.js";
import MainMenu from "@/app/components/MainMenu";

const Chessboard = dynamic(() => import("chessboardjsx"), { ssr: false });

const ChessGame: React.FC = () => {
  const [game, setGame] = useState<Chess | null>(null);
  const [fen, setFen] = useState("start");
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [elo, setElo] = useState(800);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [scores, setScores] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  const handleChange = (event: any) => {
    if (!gameStarted) {
      setElo(event.target.value);
    }
  };

  const makeAIMove = async () => {
    if (!game || gameResult) return;

    const fen = game.fen();
    const response = await fetch("/bookmarks/api/chess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        fen,
        elo
      }),
    });

    const data = await response.json();

    setLogs(prev => [
      ...prev,
      "Request\n" +
      data.request + "\n" +
      "Response\n" +
      data.response + "\n"
    ]);

    if (data.bestmove) {
      const from = data.bestmove.slice(0, 2);
      const to = data.bestmove.slice(2, 4);

      game.move({ from, to });
      setFen(game.fen());

      checkGameOver();
    }
  };

  const handleCopy = () => {
    const script = JSON.stringify(logs);
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const calculateScore = () => {
    if (gameResult?.includes("Jugador gana")) return elo + 500;
    if (gameResult?.includes("Empate")) return elo + 200;
    return elo;
  };

  const saveScore = async () => {
    if (scoreSaved) return;
    
    try {
      const response = await fetch("/bookmarks/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          gameId: 1,
          username: "player",
          score: calculateScore(),
          gameConfig: { elo }
        }),
      });

      if (response.ok) {
        setScoreSaved(true);
        await loadScores(); // Recargar scores después de guardar
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const onDrop = async ({ sourceSquare, targetSquare }: any) => {
    if (!game || gameResult) return;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move) {
        setFen(game.fen());
        setGameStarted(true);

        checkGameOver();

        if (!game.isGameOver()) {
          await makeAIMove();
          // Verificar nuevamente después del movimiento de la IA
          if (game.isGameOver()) {
            await saveScore();
          }
        } else {
          await saveScore();
        }
      }
    } catch (e) {
      // Movimiento inválido
    }
  };

  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/bookmarks/api/form?gameId=1");
      const data = await response.json();
      
      if (data.scores) {
        setTopScores(data.scores.map((score: any) => ({
          elo: score.score,
          time: score.createdAt,
          name: score.username
        })));
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  }, []);

  const checkGameOver = () => {
    if (game?.isCheckmate()) {
      setGameResult(game.turn() === "w" ? "IA gana (mate)" : "Jugador gana (mate)");
    } else if (game?.isDraw()) {
      setGameResult("Empate (tablas)");
    } else if (game?.isStalemate()) {
      setGameResult("Empate (ahogado)");
    } else if (game?.isThreefoldRepetition()) {
      setGameResult("Empate (repetición)");
    } else if (game?.isInsufficientMaterial()) {
      setGameResult("Empate (material insuficiente)");
    }
  };

  const resetGame = () => {
    if (game) {
      game.reset();
      setFen("start");
    }
    setLogs([]);
    setGameResult(null);
    setGameStarted(false);
    setScoreSaved(false);
  };

  useEffect(() => {
    loadScores();
    import("chess.js").then((module) => {
      setGame(new Chess());
    });
  }, [loadScores]); // Añadir loadScores a las dependencias

  return (
    <>
      <MainMenu />
      <Button className="game-menu" variant="contained" onClick={() => setScores(!scores)}>
        {!scores ? "Play" : "Scores"}
      </Button>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 120px)",
        textAlign: "center",
        padding: 0,
        margin: 0,
        width: "100%",
      }}>
        {scores && game && <Chessboard position={fen} onDrop={onDrop} width={420} />}
        {scores && game && (
          <Button
            onClick={resetGame}
            style={{ height: "48px", marginTop: "8px" }}
            variant="contained"
            color="primary"
          >
            Restart
          </Button>
        )}
        {scores && game && (
          <Box sx={{ width: 300, mt: 2 }}>
            <Slider
              value={elo}
              onChange={handleChange}
              min={800}
              max={2200}
              step={1}
              valueLabelDisplay="auto"
              disabled={gameStarted}
              marks={[
                { value: 800, label: '800' },
                { value: 2200, label: '2200' },
              ]}
            />
            <Typography variant="body1" align="center">
              Selected elo: {elo}
              {gameStarted && " (locked)"}
            </Typography>
          </Box>
        )}
        {scores && game && gameResult && (
          <Typography variant="h5" color="secondary" gutterBottom>
            {gameResult}
          </Typography>
        )}
        {!scores && topScores.length > 0 && <h4>Highest scores</h4>}
        {!scores && topScores.length > 0 && (
          <table style={{ width: "70%" }} border={2}>
            <tbody>
              <tr>
                <th>Pos</th>
                <th>User</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
              {topScores
                .sort((a: any, b: any) => b.elo - a.elo)
                .slice(0, 10)
                .map((a: any, i: number) => (
                  <tr key={i}>
                    <td style={{ padding: "6px" }}>{i + 1}</td>
                    <td style={{ padding: "6px" }}>{a.name}</td>
                    <td style={{ padding: "6px" }}>{a.elo}</td>
                    <td style={{ padding: "6px" }}>{new Date(a.time).toLocaleDateString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default ChessGame;