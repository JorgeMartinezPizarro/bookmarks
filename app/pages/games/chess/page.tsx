"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Typography,
  Box,
  Slider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import MainMenu from "@/app/components/MainMenu";

const ChessGame: React.FC = () => {
  const gameRef = useRef<Chess | null>(null);
  const [fen, setFen] = useState("start");
  const [elo, setElo] = useState(800);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [showScores, setShowScores] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [boardWidth, setBoardWidth] = useState(600);
  const [scoreError, setScoreError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Ajuste del ancho del tablero al cliente y al redimensionar
  useEffect(() => {
    const updateBoardWidth = () => {
      const padding = isMobile ? 16 : 32;
      const maxWidth = Math.min(600, window.innerWidth - padding);
      setBoardWidth(Math.max(200, maxWidth));
    };

    updateBoardWidth();
    window.addEventListener("resize", updateBoardWidth);
    return () => window.removeEventListener("resize", updateBoardWidth);
  }, [isMobile]);

  const handleEloChange = (_event: Event, newValue: number | number[]) => {
    if (!gameStarted) {
      setElo(newValue as number);
    }
  };

  // Cálculo de puntuación basado en el resultado
  const calculateScore = useCallback(() => {
    if (gameResult?.includes("Jugador gana")) return elo + 500;
    if (gameResult?.includes("Empate")) return elo + 200;
    return elo;
  }, [gameResult, elo]);

  // Cargar las mejores puntuaciones
  const loadScores = useCallback(async () => {
    setScoreError(null);
    try {
      const response = await fetch("/bookmarks/api/scores?gameId=1");
      const data = await response.json();
      if (data.scores) {

		console.log(data.scores);
        setTopScores(
          data.scores.map((score: any) => ({
            elo: score.score,           // La API devuelve `score`
            time: score.createdAt,      // La API devuelve `createdAt`
            name: score.username,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading scores:", error);
      setScoreError("No se pudieron cargar las puntuaciones.");
    }
  }, []);

  // Guardar puntuación
  const saveScore = useCallback(async () => {
    if (scoreSaved) return;
    setScoreError(null);
    try {
      const response = await fetch("/bookmarks/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: 1,
          score: calculateScore(),
          gameConfig: { elo },   // La API serializa este objeto a JSON
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al guardar la puntuación");
      }
      setScoreSaved(true);
      await loadScores(); // Actualiza la tabla de puntuaciones
    } catch (error) {
      console.error("Error saving score:", error);
      setScoreError("No se pudo guardar la puntuación. Inténtalo de nuevo.");
    }
  }, [scoreSaved, calculateScore, elo, loadScores]);

  // Manejar fin de partida (guarda automáticamente)
  const handleGameOver = useCallback(
    (game: Chess) => {
      let result = "";
      if (game.isCheckmate()) {
        result = game.turn() === "w" ? "IA gana (mate)" : "Jugador gana (mate)";
      } else if (game.isDraw()) {
        result = "Empate (tablas)";
      } else if (game.isStalemate()) {
        result = "Empate (ahogado)";
      } else if (game.isThreefoldRepetition()) {
        result = "Empate (repetición)";
      } else if (game.isInsufficientMaterial()) {
        result = "Empate (material insuficiente)";
      }
      if (result) {
        setGameResult(result);
        setIsGameOver(true);
      }
    },
    []
  );

  // Efecto para guardar puntuación cuando termine la partida
  useEffect(() => {
    if (gameResult && !scoreSaved && isGameOver) {
      saveScore();
    }
  }, [gameResult, scoreSaved, isGameOver, saveScore]);

  // Movimiento de la IA
  const makeAIMove = useCallback(async () => {
    const game = gameRef.current;
    if (!game || isGameOver || isAIThinking) return;

    setIsAIThinking(true);
    const currentFen = game.fen();

    try {
      const response = await fetch("/api/chess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: currentFen, elo }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener movimiento de la IA");
      }

      const data = await response.json();

      if (data.bestmove) {
        const from = data.bestmove.slice(0, 2);
        const to = data.bestmove.slice(2, 4);

        const move = game.move({
          from,
          to,
          promotion: "q",
        });

        if (move) {
          const newFen = game.fen();
          setFen(newFen);

          if (game.isGameOver()) {
            handleGameOver(game);
          }
        }
      }
    } catch (error) {
      console.error("Error making AI move:", error);
    } finally {
      setIsAIThinking(false);
    }
  }, [elo, isAIThinking, isGameOver, handleGameOver]);

  // Movimiento del jugador (drag & drop)
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      const game = gameRef.current;
      if (!game) return false;
      if (isGameOver) return false;
      if (isAIThinking) return false;

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        if (move) {
          const newFen = game.fen();
          setFen(newFen);
          if (!gameStarted) setGameStarted(true);

          if (game.isGameOver()) {
            handleGameOver(game);
          } else {
            // Turno de la IA después de un breve retraso
            setTimeout(() => makeAIMove(), 300);
          }
          return true;
        } else {
          return false;
        }
      } catch (e) {
        console.error("Error in onDrop", e);
        return false;
      }
    },
    [isGameOver, isAIThinking, gameStarted, handleGameOver, makeAIMove]
  );

  // Reiniciar partida
  const resetGame = useCallback(() => {
    const newGame = new Chess();
    gameRef.current = newGame;
    setFen("start");
    setGameResult(null);
    setGameStarted(false);
    setScoreSaved(false);
    setIsAIThinking(false);
    setIsGameOver(false);
    setScoreError(null);
  }, []);

  // Inicializar partida y cargar puntuaciones
  useEffect(() => {
    const chess = new Chess();
    gameRef.current = chess;
    setFen(chess.fen());
    loadScores();
  }, [loadScores]);

  const boardContainerStyle: React.CSSProperties = {
    width: boardWidth,
    maxWidth: "100%",
    touchAction: "none",
  };

  return (
    <>
      <MainMenu />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          mt: 2,
          mx: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={() => setShowScores(!showScores)}
          sx={{
            borderRadius: 50,
            px: 4,
            py: 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontWeight: "bold",
            textTransform: "none",
            fontSize: "1rem",
            transition: "all 0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
            },
          }}
        >
          {showScores ? "🎯 Game" : "🏆 Scores"}
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 180px)",
          textAlign: "center",
          p: 2,
        }}
      >
        {!showScores ? (
          <>
            <Box style={boardContainerStyle}>
              <Chessboard
                key={fen}
                id="chessboard"
                position={fen}
                onPieceDrop={onDrop}
                boardWidth={boardWidth}
                arePiecesDraggable={!isGameOver && !isAIThinking}
                customBoardStyle={{
                  borderRadius: "8px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                }}
              />
            </Box>

            <Button
              onClick={resetGame}
              variant="contained"
              color="secondary"
              sx={{
                mt: 2,
                borderRadius: 50,
                px: 4,
                py: 1.2,
                fontWeight: "bold",
                textTransform: "none",
                fontSize: "1rem",
				color: "grey",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                },
              }}
            >
              🔄 Restart
            </Button>

            <Box sx={{ width: "100%", maxWidth: 400, mt: 3 }}>
              <Slider
                value={elo}
                onChange={handleEloChange}
                min={800}
                max={2200}
                step={1}
                valueLabelDisplay="auto"
                disabled={gameStarted}
                marks={[
                  { value: 800, label: "800" },
                  { value: 2200, label: "2200" },
                ]}
                sx={{
                  color: theme.palette.primary.main,
                  "& .MuiSlider-markLabel": {
                    fontSize: "0.8rem",
                  },
                }}
              />
              <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                AI Strength: <strong>{elo}</strong>
                {gameStarted && " (locked)"}
              </Typography>
            </Box>

            {gameResult && (
              <Paper
                elevation={3}
                sx={{
                  mt: 2,
                  px: 4,
                  py: 1.5,
                  borderRadius: 8,
                  backgroundColor: theme.palette.secondary.light,
                  color: theme.palette.secondary.contrastText,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
                  {gameResult}
                </Typography>
              </Paper>
            )}

            {isAIThinking && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                🤔 AI is thinking...
              </Typography>
            )}

            {scoreError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {scoreError}
              </Typography>
            )}
          </>
        ) : (
          <Box sx={{ width: "100%", maxWidth: 600, px: 2 }}>
            {topScores.length > 0 ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
                  🏆 Top Scores
                </Typography>
                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>#</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>User</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Score</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topScores
                        .sort((a, b) => b.elo - a.elo)
                        .slice(0, 10)
                        .map((score, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{score.name}</TableCell>
                            <TableCell>{score.elo}</TableCell>
                            <TableCell>
                              {new Date(score.time).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {scoreError && (
                  <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    {scoreError}
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body1" color="textSecondary">
                {scoreError || "No scores yet. Play a game!"}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </>
  );
};

export default ChessGame;