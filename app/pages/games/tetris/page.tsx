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
  if (y < 0) return false;
  
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

// Hook personalizado para evitar parpadeo en el render del tablero
function useBoardRenderer(board: Board, piece: Piece, pos: { x: number; y: number }) {
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Renderizar solo cuando cambie el tablero, pieza o posición
  const getCellColor = useCallback((y: number, x: number) => {
    const isActivePiece = piece.shape.some((pieceRow, pieceY) =>
      pieceRow.some(
        (pieceCell, pieceX) =>
          pieceCell !== 0 && pos.y + pieceY === y && pos.x + pieceX === x
      )
    );

    return isActivePiece ? piece.color : board[y][x][1] === "clear" ? "black" : board[y][x][0];
  }, [board, piece, pos]);

  return { boardRef, getCellColor };
}

const Tetris: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
  const [showGame, setShowGame] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [cellSize, setCellSize] = useState(30);

  const startTimeRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const buttonPressTimer = useRef<NodeJS.Timeout | null>(null);
  const scoreSavedRef = useRef(false);
  const gameCompletedRef = useRef(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const {
    board,
    piece,
    pos,
    lines,
    isPaused,
    elapsedMs,
    gameCompleted,
    gameOver,
  } = gameState;

  const { boardRef, getCellColor } = useBoardRenderer(board, piece, pos);

  // Detect mobile and calculate cell size on mount and resize
  useEffect(() => {
    const checkMobileAndResize = () => {
      const mobile = window.innerWidth <= 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
      
      if (mobile && gameContainerRef.current) {
        const containerWidth = gameContainerRef.current.clientWidth - 20; // padding
        const calculatedCellSize = Math.floor(containerWidth / COLS);
        setCellSize(Math.min(calculatedCellSize, 30));
      } else {
        setCellSize(30);
      }
    };
    
    checkMobileAndResize();
    window.addEventListener('resize', checkMobileAndResize);
    return () => window.removeEventListener('resize', checkMobileAndResize);
  }, []);

  const updateState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const movePiece = useCallback(
    (x: number, y: number) => {
      if (isPaused || gameCompleted || gameOver) return;
      if (checkCollision(board, piece, pos.x + x, pos.y + y)) {
        return;
      }
      updateState({ pos: { x: pos.x + x, y: pos.y + y } });
    },
    [board, piece, pos, updateState, isPaused, gameCompleted, gameOver]
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
      if (scoreSavedRef.current) return;

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
      if (gameCompletedRef.current) return;

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
    if (isPaused || gameCompleted || gameOver) return;
    
    if (!checkCollision(board, piece, pos.x, pos.y + 1)) {
      updateState({ pos: { ...pos, y: pos.y + 1 } });
      return;
    }

    const newBoard = placePieceOnBoard();
    clearLines(newBoard);
    resetPiece();
  }, [board, piece, pos, updateState, placePieceOnBoard, clearLines, resetPiece, isPaused, gameCompleted, gameOver]);

  const hardDrop = useCallback(() => {
    if (isPaused || gameCompleted || gameOver) return;
    
    let dropDistance = 0;
    while (!checkCollision(board, piece, pos.x, pos.y + dropDistance + 1)) {
      dropDistance++;
    }
    
    if (dropDistance > 0) {
      updateState({ pos: { ...pos, y: pos.y + dropDistance } });
      
      const newBoard = placePieceOnBoard();
      clearLines(newBoard);
      resetPiece();
    }
  }, [board, piece, pos, updateState, placePieceOnBoard, clearLines, resetPiece, isPaused, gameCompleted, gameOver]);

  const restartGame = () => {
    gameCompletedRef.current = false;
    scoreSavedRef.current = false;
    startTimeRef.current = Date.now();
    updateState({ ...initialGameState(), isPaused: false });
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
    if (isPaused || gameCompleted || gameOver) return;
    
    const rotatedShape = rotate(piece.shape);
    if (!checkCollision(board, { ...piece, shape: rotatedShape }, pos.x, pos.y)) {
      updateState({ piece: { ...piece, shape: rotatedShape } });
    }
  }, [piece, board, pos, updateState, isPaused, gameCompleted, gameOver]);

  const handleButtonPress = useCallback(
    (action: () => void) => {
      action();
      buttonPressTimer.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(action, 100);
      }, 300);
    },
    []
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
    if (isPaused || gameCompleted || gameOver || lines >= LINES_TARGET) return;

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
    if (isPaused || gameCompleted || gameOver || lines >= LINES_TARGET) return;

    const interval = setInterval(() => {
      dropPiece();
    }, DROP_SPEED_MS);

    return () => clearInterval(interval);
  }, [isPaused, dropPiece, lines, gameCompleted, gameOver]);

  // Keyboard handler effect - optimizado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return; // Prevenir repetición automática
      
      switch (event.key.toLowerCase()) {
        case "a":
        case "arrowleft":
          event.preventDefault();
          movePiece(-1, 0);
          break;
        case "d":
        case "arrowright":
          event.preventDefault();
          movePiece(1, 0);
          break;
        case "o":
        case "p":
        case "arrowup":
          event.preventDefault();
          rotatePiece();
          break;
        case "s":
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
  }, [movePiece, rotatePiece, dropPiece, hardDrop]);

  // Load scores on mount
  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const renderBoard = () =>
    board.map((row, y) =>
      row.map((cell, x) => (
        <div
          key={`${y}-${x}`}
          className="tetris-cell"
          style={{
            backgroundColor: getCellColor(y, x),
            width: isMobile ? cellSize : 30,
            height: isMobile ? cellSize : 30,
          }}
        />
      ))
    );

  const renderMobileControls = () => (
    <Box className="mobile-controls">
      <Box className="mobile-controls-row">
        <Button
          variant="contained"
          className="mobile-btn mobile-btn-rotate"
          onTouchStart={(e) => { e.preventDefault(); rotatePiece(); }}
          onClick={() => rotatePiece()}
        >
          ↻
        </Button>
        <Button
          variant="contained"
          className="mobile-btn mobile-btn-harddrop"
          onTouchStart={(e) => { e.preventDefault(); hardDrop(); }}
          onClick={() => hardDrop()}
        >
          ⬇⬇
        </Button>
      </Box>
      <Box className="mobile-controls-row">
        <Button
          variant="contained"
          className="mobile-btn mobile-btn-left"
          onTouchStart={(e) => { e.preventDefault(); handleButtonPress(() => movePiece(-1, 0)); }}
          onTouchEnd={handleButtonRelease}
          onMouseDown={() => handleButtonPress(() => movePiece(-1, 0))}
          onMouseUp={handleButtonRelease}
          onMouseLeave={handleButtonRelease}
        >
          ◀
        </Button>
        <Button
          variant="contained"
          className="mobile-btn mobile-btn-drop"
          onTouchStart={(e) => { e.preventDefault(); handleButtonPress(dropPiece); }}
          onTouchEnd={handleButtonRelease}
          onMouseDown={() => handleButtonPress(dropPiece)}
          onMouseUp={handleButtonRelease}
          onMouseLeave={handleButtonRelease}
        >
          ▼
        </Button>
        <Button
          variant="contained"
          className="mobile-btn mobile-btn-right"
          onTouchStart={(e) => { e.preventDefault(); handleButtonPress(() => movePiece(1, 0)); }}
          onTouchEnd={handleButtonRelease}
          onMouseDown={() => handleButtonPress(() => movePiece(1, 0))}
          onMouseUp={handleButtonRelease}
          onMouseLeave={handleButtonRelease}
        >
          ▶
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box className={`tetris-container ${isMobile ? 'mobile' : ''}`}>
      <MainMenu />
      <Box className="tetris-game-wrapper" ref={gameContainerRef}>
        <Box className="tetris-header">
          <Box className="tetris-menu">
            <Button
              className="game-menu"
              variant="contained"
              size="small"
              onClick={() => setShowGame(!showGame)}
            >
              {!showGame ? "Play" : "Scores"}
            </Button>
            <Button
              className="game-menu"
              variant="contained"
              size="small"
              onClick={restartGame}
            >
              Reiniciar
            </Button>
            <Button
              className="game-menu"
              variant="contained"
              size="small"
              onClick={togglePause}
              disabled={gameCompleted || gameOver}
            >
              {isPaused ? "Reanudar" : "Pausar"}
            </Button>
          </Box>
        </Box>

        {showGame && (
          <>
            <Box className={`tetris-stats ${isMobile ? 'mobile' : ''}`}>
              <Typography variant="body2" className="tetris-stat">
                Lines: {Math.min(lines, LINES_TARGET)} / {LINES_TARGET}
              </Typography>
              <Typography variant="body2" className="tetris-stat">
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

            <Box className={`tetris-board-container ${isMobile ? 'mobile' : ''}`}>
              <Box className="tetris-board" ref={boardRef}>{renderBoard()}</Box>
            </Box>

            {isMobile && renderMobileControls()}

            {!isMobile && (
              <Box className="tetris-controls-desktop">
                <Typography variant="caption" className="controls-hint">
                  A/D: Move | O/P: Rotate | S: Drop | Space: Hard Drop
                </Typography>
              </Box>
            )}
          </>
        )}

        {!showGame && (
          <Box className="tetris-scores">
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
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Tetris;