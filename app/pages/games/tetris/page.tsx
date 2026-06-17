'use client';

import MainMenu from "@/app/components/MainMenu";
import {
  GAME_IDS,
  GetScoresResponse,
  ScoreEntry,
} from "@/app/lib/scores/types";
import { Box, Button, Typography } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./styles.css";

type Cell = [string, string];
type Board = Cell[][];
type Piece = { shape: number[][]; color: string };

type LeaderboardEntry = {
  name: string;
  timeMs: number;
  linesTarget: number;
};

const LINES_TARGET = 25;
const DROP_SPEED_MS = 184;
const TIMER_TICK_MS = 10;

const createBoard = (rows: number, cols: number): Board =>
  Array.from(Array(rows), () =>
    Array(cols)
      .fill(null)
      .map(() => ["0", "clear"] as Cell)
  );

const rotate = (matrix: number[][]): number[][] =>
  matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]).reverse());

const checkCollision = (
  board: Board,
  piece: Piece,
  x: number,
  y: number
): boolean =>
  piece.shape.some((row, rowIndex) =>
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

const TETROMINOS: Piece[] = [
  { shape: [[1, 1, 1], [0, 1, 0]], color: "red" },
  { shape: [[1, 1], [1, 1]], color: "yellow" },
  { shape: [[1, 1, 0], [0, 1, 1]], color: "green" },
  { shape: [[0, 1, 1], [1, 1, 0]], color: "blue" },
  { shape: [[1, 1, 1, 1]], color: "cyan" },
  { shape: [[1, 1, 1], [1, 0, 0]], color: "orange" },
  { shape: [[1, 1, 1], [0, 0, 1]], color: "purple" },
];

const getRandomPiece = (): Piece =>
  TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];

function formatTimeMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = ms % 1000;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${millis
      .toString()
      .padStart(3, "0")}`;
  }

  return `${seconds}.${millis.toString().padStart(3, "0")}s`;
}

function parseLeaderboardEntry(entry: ScoreEntry): LeaderboardEntry {
  const linesTarget =
    typeof entry.gameConfig?.linesTarget === "number"
      ? entry.gameConfig.linesTarget
      : LINES_TARGET;

  if (typeof entry.gameConfig?.linesTarget === "number" || entry.score >= 1000) {
    return {
      name: entry.username,
      timeMs: entry.score,
      linesTarget,
    };
  }

  const legacySeconds =
    typeof entry.gameConfig?.timer === "number" ? entry.gameConfig.timer : 0;

  return {
    name: entry.username,
    timeMs: legacySeconds * 1000,
    linesTarget: entry.score,
  };
}

const Tetris: React.FC = () => {
  const [board, setBoard] = useState<Board>(createBoard(20, 10));
  const [piece, setPiece] = useState<Piece>(getRandomPiece());
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [lines, setLines] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
  const [showGame, setShowGame] = useState(true);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const buttonPressTimer = useRef<NodeJS.Timeout | null>(null);

  const movePiece = useCallback(
    (x: number, y: number) => {
      if (!checkCollision(board, piece, pos.x + x, pos.y + y)) {
        setPos((prev) => ({ x: prev.x + x, y: prev.y + y }));
      }
    },
    [board, piece, pos]
  );

  const loadScores = useCallback(async () => {
    try {
      const response = await fetch(
        `/bookmarks/api/scores?gameId=${GAME_IDS.TETRIS}`
      );
      const data: GetScoresResponse = await response.json();

      if (response.ok && data.scores) {
        setTopScores(data.scores.map(parseLeaderboardEntry));
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  }, []);

  const saveScore = useCallback(
    async (timeMs: number) => {
      if (scoreSaved) {
        return;
      }

      try {
        const response = await fetch("/bookmarks/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: GAME_IDS.TETRIS,
            score: timeMs,
            gameConfig: { linesTarget: LINES_TARGET },
          }),
        });

        if (response.ok) {
          setScoreSaved(true);
          await loadScores();
        }
      } catch (error) {
        console.error("Error saving score:", error);
      }
    },
    [scoreSaved, loadScores]
  );

  const completeGame = useCallback(
    (finalMs: number) => {
      setElapsedMs(finalMs);
      setGameCompleted(true);
      setIsPaused(true);
      saveScore(finalMs);
    },
    [saveScore]
  );

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    setIsPaused(true);
  }, []);

  const resetPiece = useCallback(() => {
    const newPiece = getRandomPiece();
    const initialPos = { x: 3, y: 0 };

    if (checkCollision(board, newPiece, initialPos.x, initialPos.y)) {
      handleGameOver();
      return;
    }

    setPiece(newPiece);
    setPos(initialPos);
  }, [board, handleGameOver]);

  const clearLines = useCallback(
    (currentBoard: Board) => {
      const clearedBoard = currentBoard.filter((row) =>
        row.some((cell) => cell[1] === "clear")
      );
      const clearedLines = currentBoard.length - clearedBoard.length;
      const newRows = Array(clearedLines)
        .fill(null)
        .map(() =>
          Array(currentBoard[0].length)
            .fill(null)
            .map(() => ["0", "clear"] as Cell)
        );
      const newBoard = [...newRows, ...clearedBoard];
      setBoard(newBoard);

      setLines((prev) => {
        const next = prev + clearedLines;
        if (
          next >= LINES_TARGET &&
          !gameCompleted &&
          startTimeRef.current !== null
        ) {
          const finalMs = Date.now() - startTimeRef.current;
          queueMicrotask(() => completeGame(finalMs));
        }
        return next;
      });
    },
    [completeGame, gameCompleted]
  );

  const dropPiece = useCallback(() => {
    if (!checkCollision(board, piece, pos.x, pos.y + 1)) {
      setPos((prev) => ({ ...prev, y: prev.y + 1 }));
      return;
    }

    const newBoard = board.map((row) => row.map((cell) => [...cell] as Cell));
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
  }, [board, clearLines, piece, pos, resetPiece]);

  const restartGame = () => {
    setBoard(createBoard(20, 10));
    setPiece(getRandomPiece());
    setPos({ x: 3, y: 0 });
    setLines(0);
    setElapsedMs(0);
    setScoreSaved(false);
    setGameCompleted(false);
    setGameOver(false);
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isPaused) {
      startTimeRef.current = Date.now() - elapsedMs;
      setIsPaused(false);
      return;
    }

    setIsPaused(true);
  };

  const rotatePiece = useCallback(() => {
    const rotatedShape = rotate(piece.shape);
    if (!checkCollision(board, { ...piece, shape: rotatedShape }, pos.x, pos.y)) {
      setPiece({ ...piece, shape: rotatedShape });
    }
  }, [piece, board, pos]);

  const handleButtonPress = useCallback(
    (action: () => void) => {
      if (isPaused || gameCompleted || gameOver) {
        return;
      }
      action();
      buttonPressTimer.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(action, 100);
      }, 300);
    },
    [isPaused, gameCompleted, gameOver]
  );

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
    if (isPaused || gameCompleted || gameOver || lines >= LINES_TARGET) {
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }, TIMER_TICK_MS);

    return () => clearInterval(interval);
  }, [isPaused, gameCompleted, gameOver, lines]);

  useEffect(() => {
    if (isPaused || gameCompleted || gameOver || lines >= LINES_TARGET) {
      return;
    }

    const interval = setInterval(() => {
      dropPiece();
    }, DROP_SPEED_MS);

    return () => clearInterval(interval);
  }, [isPaused, board, piece, pos, dropPiece, lines, gameCompleted, gameOver]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPaused || gameCompleted || gameOver) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "a":
          movePiece(-1, 0);
          break;
        case "d":
          movePiece(1, 0);
          break;
        case "o":
        case "p":
          rotatePiece();
          break;
        case "s":
          dropPiece();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, dropPiece, movePiece, rotatePiece, gameCompleted, gameOver]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const renderBoard = () =>
    board.map((row, y) =>
      row.map((cell, x) => {
        const isActivePiece = piece.shape.some((pieceRow, pieceY) =>
          pieceRow.some(
            (pieceCell, pieceX) =>
              pieceCell !== 0 && pos.y + pieceY === y && pos.x + pieceX === x
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

  return (
    <Box className="tetris-container">
      <MainMenu />
      <Box className="tetris-menu">
        <Button
          className="game-menu"
          variant="contained"
          onClick={() => setShowGame(!showGame)}
        >
          {!showGame ? "Play" : "Scores"}
        </Button>
        <Button className="game-menu" variant="contained" onClick={restartGame}>
          Reiniciar
        </Button>
        <Button
          className="game-menu"
          variant="contained"
          onClick={togglePause}
          disabled={gameCompleted || gameOver}
        >
          {isPaused ? "Reanudar" : "Pausar"}
        </Button>
      </Box>

      {showGame && (
        <>
          <Box className="tetris-settings">
            <Typography variant="body2" className="tetris-settings-label">
              Settings
            </Typography>
            <Typography variant="body1" className="tetris-settings-value">
              {LINES_TARGET} lines
            </Typography>
          </Box>

          <Box className="tetris-stats">
            <Typography variant="body1" className="tetris-stat">
              Lines: {Math.min(lines, LINES_TARGET)} / {LINES_TARGET}
            </Typography>
            <Typography variant="body1" className="tetris-stat">
              Time: {formatTimeMs(elapsedMs)}
            </Typography>
          </Box>

          {gameCompleted && (
            <Typography variant="h6" className="tetris-status tetris-status-win">
              Completed in {formatTimeMs(elapsedMs)}
            </Typography>
          )}
          {gameOver && (
            <Typography variant="h6" className="tetris-status tetris-status-over">
              Game over
            </Typography>
          )}

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
                onClick={() => rotatePiece()}
              >
                O
              </Button>
              <Button
                variant="contained"
                className="control-btn rotate-btn"
                onClick={() => rotatePiece()}
              >
                P
              </Button>
            </div>
          </Box>
        </>
      )}

      {!showGame && (
        <>
          <h4 className="scores-title">Best times</h4>
          {topScores.length === 0 ? (
            <p className="scores-empty">No scores yet</p>
          ) : (
            <table className="scores-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>User</th>
                  <th>Time</th>
                  <th>Lines</th>
                </tr>
              </thead>
              <tbody>
                {[...topScores]
                  .sort((a, b) => a.timeMs - b.timeMs)
                  .slice(0, 10)
                  .map((entry, i) => (
                    <tr key={`${entry.name}-${entry.timeMs}-${i}`}>
                      <td>{i + 1}</td>
                      <td>{entry.name}</td>
                      <td>{formatTimeMs(entry.timeMs)}</td>
                      <td>{entry.linesTarget}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Box>
  );
};

export default Tetris;
