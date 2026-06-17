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

const ROWS = 20;
const COLS = 10;

const createBoard = (rows: number = ROWS, cols: number = COLS): Board =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ["0", "clear"] as Cell)
  );

const rotate = (matrix: number[][]): number[][] =>
  matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]).reverse());

const checkCollision = (
  board: Board,
  piece: Piece,
  x: number,
  y: number
): boolean => {
  if (y < 0) return false; // Allow pieces above the board
  
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

interface GameState {
  board: Board;
  piece: Piece;
  pos: { x: number; y: number };
  lines: number;
  isPaused: boolean;
  elapsedMs: number;
  gameCompleted: boolean;
  gameOver: boolean;
  scoreSaved: boolean;
}

const initialGameState = (): GameState => ({
  board: createBoard(),
  piece: getRandomPiece(),
  pos: { x: Math.floor(COLS / 2) - 1, y: 0 },
  lines: 0,
  isPaused: true,
  elapsedMs: 0,
  gameCompleted: false,
  gameOver: false,
  scoreSaved: false,
});

const Tetris: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
  const [showGame, setShowGame] = useState(true);

  const startTimeRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const buttonPressTimer = useRef<NodeJS.Timeout | null>(null);
  const scoreSavedRef = useRef(false);
  const gameCompletedRef = useRef(false);

  const {
    board,
    piece,
    pos,
    lines,
    isPaused,
    elapsedMs,
    gameCompleted,
    gameOver,
    scoreSaved,
  } = gameState;

  const updateState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const movePiece = useCallback(
    (x: number, y: number) => {
      if (checkCollision(board, piece, pos.x + x, pos.y + y)) {
        return; // Can't move in this direction
      }
      updateState({ pos: { x: pos.x + x, y: pos.y + y } });
    },
    [board, piece, pos, updateState]
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
      if (scoreSavedRef.current) {
        return;
      }

      scoreSavedRef.current = true;

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
          updateState({ scoreSaved: true });
          await loadScores();
        } else {
          scoreSavedRef.current = false;
        }
      } catch (error) {
        console.error("Error saving score:", error);
        scoreSavedRef.current = false;
      }
    },
    [loadScores, updateState]
  );

  const completeGame = useCallback(
    (finalMs: number) => {
      if (gameCompletedRef.current) {
        return;
      }

      gameCompletedRef.current = true;
      updateState({ elapsedMs: finalMs, gameCompleted: true, isPaused: true });
      saveScore(finalMs);
    },
    [saveScore, updateState]
  );

  const handleGameOver = useCallback(() => {
    updateState({ gameOver: true, isPaused: true });
  }, [updateState]);

  const resetPiece = useCallback(() => {
    const newPiece = getRandomPiece();
    const initialPos = { x: Math.floor(COLS / 2) - 1, y: 0 };

    if (checkCollision(board, newPiece, initialPos.x, initialPos.y)) {
      handleGameOver();
      return;
    }

    updateState({ piece: newPiece, pos: initialPos });
  }, [board, handleGameOver, updateState]);

  const clearLines = useCallback(
    (currentBoard: Board) => {
      const clearedBoard = currentBoard.filter((row) =>
        row.some((cell) => cell[1] === "clear")
      );
      const clearedLines = currentBoard.length - clearedBoard.length;
      
      if (clearedLines === 0) {
        updateState({ board: currentBoard });
        return;
      }
      
      const newRows = Array.from({ length: clearedLines }, () =>
        Array.from({ length: currentBoard[0].length }, () => ["0", "clear"] as Cell)
      );
      const newBoard = [...newRows, ...clearedBoard];
      const newLines = lines + clearedLines;

      updateState({ board: newBoard, lines: newLines });

      if (newLines >= LINES_TARGET && !gameCompletedRef.current) {
        const finalMs = Date.now() - (startTimeRef.current ?? Date.now());
        completeGame(finalMs);
      }
    },
    [lines, completeGame, updateState]
  );

  const placePieceOnBoard = useCallback((): Board => {
    const newBoard = board.map((row) => row.map((cell) => [...cell] as Cell));
    
    piece.shape.forEach((row, rowIndex) =>
      row.forEach((cell, colIndex) => {
        if (cell !== 0) {
          const newY = pos.y + rowIndex;
          const newX = pos.x + colIndex;
          if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
            newBoard[newY][newX] = [piece.color, "filled"];
          }
        }
      })
    );
    
    return newBoard;
  }, [board, piece, pos]);

  const dropPiece = useCallback(() => {
    // Check if piece can move down
    if (!checkCollision(board, piece, pos.x, pos.y + 1)) {
      updateState({ pos: { ...pos, y: pos.y + 1 } });
      return;
    }

    // Piece has landed, place it on the board
    const newBoard = placePieceOnBoard();
    clearLines(newBoard);
    resetPiece();
  }, [board, piece, pos, updateState, placePieceOnBoard, clearLines, resetPiece]);

  const hardDrop = useCallback(() => {
    let dropDistance = 0;
    while (!checkCollision(board, piece, pos.x, pos.y + dropDistance + 1)) {
      dropDistance++;
    }
    
    if (dropDistance > 0) {
      updateState({ pos: { ...pos, y: pos.y + dropDistance } });
      
      // Place piece and reset
      const newBoard = placePieceOnBoard();
      clearLines(newBoard);
      resetPiece();
    }
  }, [board, piece, pos, updateState, placePieceOnBoard, clearLines, resetPiece]);

  const restartGame = () => {
    gameCompletedRef.current = false;
    scoreSavedRef.current = false;
    startTimeRef.current = Date.now();
    updateState(initialGameState());
  };

  const togglePause = () => {
    if (isPaused) {
      startTimeRef.current = Date.now() - elapsedMs;
      updateState({ isPaused: false });
      return;
    }

    updateState({ isPaused: true });
  };

  const rotatePiece = useCallback(() => {
    const rotatedShape = rotate(piece.shape);
    if (!checkCollision(board, { ...piece, shape: rotatedShape }, pos.x, pos.y)) {
      updateState({ piece: { ...piece, shape: rotatedShape } });
    }
  }, [piece, board, pos, updateState]);

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

  // Timer effect
  useEffect(() => {
    if (isPaused || gameCompleted || gameOver || lines >= LINES_TARGET) {
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        updateState({ elapsedMs: Date.now() - startTimeRef.current });
      }
    }, TIMER_TICK_MS);

    return () => clearInterval(interval);
  }, [isPaused, gameCompleted, gameOver, lines, updateState]);

  // Drop piece effect
  useEffect(() => {
    if (isPaused || gameCompleted || gameOver || lines >= LINES_TARGET) {
      return;
    }

    const interval = setInterval(() => {
      dropPiece();
    }, DROP_SPEED_MS);

    return () => clearInterval(interval);
  }, [isPaused, dropPiece, lines, gameCompleted, gameOver]);

  // Keyboard handler effect
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
          hardDrop(); // Changed from dropPiece to hardDrop for better feel
          break;
        case "arrowleft":
          event.preventDefault();
          movePiece(-1, 0);
          break;
        case "arrowright":
          event.preventDefault();
          movePiece(1, 0);
          break;
        case "arrowup":
          event.preventDefault();
          rotatePiece();
          break;
        case "arrowdown":
          event.preventDefault();
          dropPiece();
          break;
        case " ":
          event.preventDefault();
          hardDrop();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPaused, dropPiece, hardDrop, movePiece, rotatePiece, gameCompleted, gameOver]);

  // Load scores on mount
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
            style={{ backgroundColor, border: "1px solid #333" }}
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