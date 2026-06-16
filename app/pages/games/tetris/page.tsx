'use client';

import { Box, Button, Stack, Typography } from "@mui/material";
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./styles.css"; // <-- Sin .module, asegúrate de tener declaración de tipos o usa require
import MainMenu from "@/app/components/MainMenu";

type Cell = [string, string]; // [color, state]
type Board = Cell[][];
type Piece = { shape: number[][]; color: string };
const speed = 184;
const createBoard = (rows: number, cols: number): Board =>
  Array.from(Array(rows), () => Array(cols).fill(null).map(() => ["0", "clear"]));

const rotate = (matrix: number[][]): number[][] =>
  matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]).reverse());

const checkCollision = (board: Board, piece: Piece, x: number, y: number): boolean => {
  return piece.shape.some((row, rowIndex) =>
    row.some((cell, colIndex) => {
      if (cell !== 0) {
        const newX = x + colIndex;
        const newY = y + rowIndex;
        if (
          newY >= board.length ||
          newX < 0 ||
          newX >= board[0].length ||
          (newY >= 0 && board[newY][newX][1] !== "clear")
        ) {
          return true;
        }
      }
      return false;
    })
  );
};

const TETROMINOS = [
  { shape: [[1, 1, 1], [0, 1, 0]], color: "red" },
  { shape: [[1, 1], [1, 1]], color: "yellow" },
  { shape: [[1, 1, 0], [0, 1, 1]], color: "green" },
  { shape: [[0, 1, 1], [1, 1, 0]], color: "blue" },
  { shape: [[1, 1, 1, 1]], color: "cyan" },
  { shape: [[1, 1, 1], [1, 0, 0]], color: "orange" },
  { shape: [[1, 1, 1], [0, 0, 1]], color: "purple" },
];

const getRandomPiece = (): Piece => {
  const randomIndex = Math.floor(Math.random() * TETROMINOS.length);
  return TETROMINOS[randomIndex];
};

const Tetris: React.FC = () => {
  const [board, setBoard] = useState<Board>(createBoard(20, 10));
  const [piece, setPiece] = useState<Piece>(getRandomPiece());
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [lines, setLines] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [timer, setTimer] = useState(0);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [scores, setScores] = useState(true);
  const [scoreSaved, setScoreSaved] = useState(false);

  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const buttonPressTimer = useRef<NodeJS.Timeout | null>(null);

  const movePiece = useCallback((x: number, y: number) => {
    if (!checkCollision(board, piece, pos.x + x, pos.y + y)) {
      setPos(prev => ({ x: prev.x + x, y: prev.y + y }));
    }
  }, [board, piece, pos]);

  // ====== NUEVO ENDPOINT ======
  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/bookmarks/api/scores?gameId=3");
      const data = await response.json();

      if (data.scores) {
        setTopScores(data.scores.map((score: any) => ({
          lines: score.score,                // el campo 'score' del endpoint
          speed: score.gameConfig?.timer || 0,
          name: score.username,
          time: score.createdAt
        })));
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  }, []);

  const saveScore = async () => {
    if (scoreSaved) return;

    try {
      const response = await fetch("/bookmarks/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: 3,
          username: "player",
          score: lines,
          gameConfig: { timer }
        }),
      });

      if (response.ok) {
        setScoreSaved(true);
        await loadScores();
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const finishGame = useCallback(() => {
    setIsPaused(true);
    saveScore();
  }, [saveScore]);

  const resetPiece = useCallback(() => {
    const newPiece = getRandomPiece();
    const initialPos = { x: 3, y: 0 };

    if (checkCollision(board, newPiece, initialPos.x, initialPos.y)) {
      finishGame();
      return;
    }

    setPiece(newPiece);
    setPos(initialPos);
  }, [board, finishGame]);

  const clearLines = useCallback((currentBoard: Board) => {
    const clearedBoard = currentBoard.filter(row => row.some(cell => cell[1] === "clear"));
    const clearedLines = currentBoard.length - clearedBoard.length;
    const newRows = Array(clearedLines).fill(null).map(() =>
      Array(currentBoard[0].length).fill(null).map(() => ["0", "clear"] as Cell)
    );
    const newBoard = [...newRows, ...clearedBoard];
    setBoard(newBoard);
    setLines(prev => prev + clearedLines);
  }, []);

  const dropPiece = useCallback(() => {
    if (!checkCollision(board, piece, pos.x, pos.y + 1)) {
      setPos(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      const newBoard = board.map(row => row.map(cell => [...cell] as Cell));
      piece.shape.forEach((row, rowIndex) =>
        row.forEach((cell, colIndex) => {
          if (cell !== 0) {
            const newY = pos.y + rowIndex;
            const newX = pos.x + colIndex;
            if (newY >= 0) {
              newBoard[newY][newX] = [piece.color, "filled"];
            }
          }
        })
      );
      clearLines(newBoard);
      resetPiece();
    }
  }, [board, clearLines, piece, pos, resetPiece]);

  const restartGame = () => {
    setBoard(createBoard(20, 10));
    setPiece(getRandomPiece());
    setPos({ x: 3, y: 0 });
    setLines(0);
    setIsPaused(false);
    setTimer(0);
    setScoreSaved(false);
  };

  const rotatePiece = useCallback((direction: number) => {
    const rotatedShape = rotate(piece.shape);
    if (!checkCollision(board, { ...piece, shape: rotatedShape }, pos.x, pos.y)) {
      setPiece({ ...piece, shape: rotatedShape });
    }
  }, [piece, board, pos]);

  // Handlers para mantener presionado (móvil)
  const handleButtonPress = useCallback((action: () => void) => {
    if (isPaused) return;
    action();
    buttonPressTimer.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(action, 100);
    }, 300);
  }, [isPaused]);

  const handleButtonRelease = useCallback(() => {
    if (buttonPressTimer.current) {
      clearTimeout(buttonPressTimer.current);
      buttonPressTimer.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPaused) return;
    if (lines >= 40) {
      finishGame();
      return;
    }

    const countdown = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(countdown);
  }, [isPaused, lines, finishGame]);

  useEffect(() => {
    if (isPaused || lines >= 40) return;
    const interval = setInterval(() => {
      dropPiece();
    }, speed);
    return () => clearInterval(interval);
  }, [isPaused, board, piece, pos, dropPiece, lines]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPaused) return;

      switch (event.key.toLowerCase()) {
        case "a":
          movePiece(-1, 0);
          break;
        case "d":
          movePiece(1, 0);
          break;
        case "o":
          rotatePiece(-1);
          break;
        case "p":
          rotatePiece(1);
          break;
        case "s":
          dropPiece();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPaused, dropPiece, movePiece, rotatePiece]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const renderBoard = () => {
    return board.map((row, y) =>
      row.map((cell, x) => {
        const isActivePiece =
          piece.shape.some(
            (pieceRow, pieceY) =>
              pieceRow.some(
                (pieceCell, pieceX) =>
                  pieceCell !== 0 &&
                  pos.y + pieceY === y &&
                  pos.x + pieceX === x
              )
          );

        const backgroundColor = isActivePiece
          ? piece.color
          : cell[1] === "clear"
          ? "black"
          : cell[0];

        return (
          <div
            key={`${y}-${x}`}
            className="tetris-cell"
            style={{ backgroundColor }}
          />
        );
      })
    );
  };

  return (
    <Box className="tetris-container">
      <MainMenu />
      <Box className="tetris-menu">
        <Button className="game-menu" variant="contained" onClick={() => setScores(!scores)}>
          {!scores ? "Play" : "Scores"}
        </Button>
        <Button className="game-menu" variant="contained" onClick={restartGame}>
          Reiniciar
        </Button>
        <Button className="game-menu" variant="contained" onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? "Reanudar" : "Pausar"}
        </Button>
        <Typography variant="body1" className="tetris-lines">
          {lines}
        </Typography>
      </Box>

      {scores && (
        <>
          <Box className="tetris-board">{renderBoard()}</Box>
          <Box className="tetris-controls">
            <div className="tetris-controls-left">
              <Button
                variant="contained"
                className="control-btn"
                onMouseDown={() => handleButtonPress(() => movePiece(-1, 0))}
                onMouseUp={handleButtonRelease}
                onMouseLeave={handleButtonRelease}
                onTouchStart={() => handleButtonPress(() => movePiece(-1, 0))}
                onTouchEnd={handleButtonRelease}
              >
                {"<"}
              </Button>
              <Button
                variant="contained"
                className="control-btn"
                onMouseDown={() => handleButtonPress(dropPiece)}
                onMouseUp={handleButtonRelease}
                onMouseLeave={handleButtonRelease}
                onTouchStart={() => handleButtonPress(dropPiece)}
                onTouchEnd={handleButtonRelease}
              >
                {"v"}
              </Button>
              <Button
                variant="contained"
                className="control-btn"
                onMouseDown={() => handleButtonPress(() => movePiece(1, 0))}
                onMouseUp={handleButtonRelease}
                onMouseLeave={handleButtonRelease}
                onTouchStart={() => handleButtonPress(() => movePiece(1, 0))}
                onTouchEnd={handleButtonRelease}
              >
                {">"}
              </Button>
            </div>
            <div className="tetris-controls-right">
              <Button
                variant="contained"
                className="control-btn rotate-btn"
                onClick={() => rotatePiece(-1)}
              >
                O
              </Button>
              <Button
                variant="contained"
                className="control-btn rotate-btn"
                onClick={() => rotatePiece(1)}
              >
                P
              </Button>
            </div>
          </Box>
        </>
      )}

      {!scores && topScores.length > 0 && <h4 className="scores-title">Highest scores</h4>}
      {!scores && topScores.length > 0 && (
        <table className="scores-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>User</th>
              <th>Lines</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {topScores
              .sort((a: any, b: any) => b.lines - a.lines)
              .slice(0, 10)
              .map((a: any, i: number) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{a.name}</td>
                  <td>{a.lines}</td>
                  <td>{a.speed}s</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </Box>
  );
};

export default Tetris;