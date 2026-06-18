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
const HOLD_INITIAL_DELAY = 300; // ms before auto-repeat kicks in
const HOLD_REPEAT_RATE = 100;  // ms between each repeated step

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
  { shape: [[1, 1, 1], [0, 1, 0]], color: "#e03030" },   // T - red
  { shape: [[1, 1], [1, 1]], color: "#e0c030" },          // O - yellow
  { shape: [[1, 1, 0], [0, 1, 1]], color: "#30c030" },    // S - green
  { shape: [[0, 1, 1], [1, 1, 0]], color: "#3070e0" },    // Z - blue
  { shape: [[1, 1, 1, 1]], color: "#30d0d0" },            // I - cyan
  { shape: [[1, 1, 1], [1, 0, 0]], color: "#e07030" },    // L - orange
  { shape: [[1, 1, 1], [0, 0, 1]], color: "#a030e0" },    // J - purple
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

// ─── Pure helpers that don't depend on React state ───────────────────────────

function placePieceOnBoardPure(
  board: Board,
  piece: Piece,
  pos: { x: number; y: number }
): Board {
  const newBoard = board.map((row) => row.map((cell) => [...cell] as Cell));
  piece.shape.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => {
      if (cell !== 0) {
        const ny = pos.y + rowIndex;
        const nx = pos.x + colIndex;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
          newBoard[ny][nx] = [piece.color, "filled"];
        }
      }
    })
  );
  return newBoard;
}

function clearLinesPure(board: Board): { newBoard: Board; cleared: number } {
  const kept = board.filter((row) => row.some((cell) => cell[1] === "clear"));
  const cleared = board.length - kept.length;
  if (cleared === 0) return { newBoard: board, cleared: 0 };
  const newRows = Array.from({ length: cleared }, () =>
    Array.from({ length: board[0].length }, () => ["0", "clear"] as Cell)
  );
  return { newBoard: [...newRows, ...kept], cleared };
}

function hardDropDistance(
  board: Board,
  piece: Piece,
  pos: { x: number; y: number }
): number {
  let dist = 0;
  while (!checkCollision(board, piece, pos.x, pos.y + dist + 1)) dist++;
  return dist;
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const [gameState, setGameState] = useState<GameState>({
	board: createBoard(),
	piece: TETROMINOS[0], // cualquier pieza fija
	pos: { x: Math.floor(COLS / 2) - 1, y: 0 },
	lines: 0,
	isPaused: true,
	elapsedMs: 0,
	gameCompleted: false,
	gameOver: false,
	scoreSaved: false,
  });
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
  const [showGame, setShowGame] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [cellSize, setCellSize] = useState(28);

  // Refs that hold the *latest* game state for use inside interval callbacks
  const gsRef = useRef<GameState>(gameState);
  gsRef.current = gameState;

  const startTimeRef = useRef<number | null>(null);
  const scoreSavedRef = useRef(false);
  const gameCompletedRef = useRef(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const activeKeysRef = useRef<Set<string>>(new Set());
  const holdTimersRef = useRef<Map<string, ReturnType<typeof setTimeout | typeof setInterval>>>(new Map());

  const { board, piece, pos, lines, isPaused, elapsedMs, gameCompleted, gameOver } = gameState;

  useEffect(() => {
    setGameState(initialGameState());
  }, []);
  // ── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
      if (mobile && gameContainerRef.current) {
        const w = gameContainerRef.current.clientWidth - 20;
        setCellSize(Math.min(Math.floor(w / COLS), 28));
      } else {
        setCellSize(28);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Score helpers ─────────────────────────────────────────────────────────
  const loadScores = useCallback(async () => {
    try {
      const response = await fetch(`/bookmarks/api/scores?gameId=${GAME_IDS.TETRIS}`);
      const data: GetScoresResponse = await response.json();
      if (response.ok && data.scores) {
        setTopScores(data.scores.map(parseLeaderboardEntry));
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  }, []);

  const saveScore = useCallback(async (timeMs: number) => {
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
        setGameState(prev => ({ ...prev, scoreSaved: true }));
        await loadScores();
      } else {
        scoreSavedRef.current = false;
      }
    } catch (error) {
      console.error("Error saving score:", error);
      scoreSavedRef.current = false;
    }
  }, [loadScores]);

  useEffect(() => { loadScores(); }, [loadScores]);

  // ── Core game logic (all operate on latest state via gsRef) ───────────────

  /**
   * Attempt to lock the current piece, clear lines, spawn next piece.
   * Returns false if the game ended (game over).
   */
  const lockAndAdvance = useCallback((
    board: Board,
    piece: Piece,
    pos: { x: number; y: number },
    currentLines: number,
    currentElapsed: number
  ) => {
    const newBoard = placePieceOnBoardPure(board, piece, pos);
    const { newBoard: clearedBoard, cleared } = clearLinesPure(newBoard);
    const totalLines = currentLines + cleared;

    const nextPiece = getRandomPiece();
    const nextPos = { x: Math.floor(COLS / 2) - 1, y: 0 };

    // Check game-over: new piece immediately collides
    const isGameOver = checkCollision(clearedBoard, nextPiece, nextPos.x, nextPos.y);

    const isCompleted = !isGameOver && totalLines >= LINES_TARGET && !gameCompletedRef.current;
    if (isCompleted) {
      gameCompletedRef.current = true;
      const finalMs = startTimeRef.current != null ? Date.now() - startTimeRef.current : currentElapsed;
      setGameState(prev => ({
        ...prev,
        board: clearedBoard,
        lines: totalLines,
        piece: nextPiece,
        pos: nextPos,
        isPaused: true,
        gameCompleted: true,
        elapsedMs: finalMs,
      }));
      saveScore(finalMs);
      return;
    }

    if (isGameOver) {
      setGameState(prev => ({
        ...prev,
        board: clearedBoard,
        lines: totalLines,
        isPaused: true,
        gameOver: true,
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      board: clearedBoard,
      lines: totalLines,
      piece: nextPiece,
      pos: nextPos,
    }));
  }, [saveScore]);

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || gameCompleted || gameOver) return;
    const id = setInterval(() => {
      setGameState(prev => {
        if (prev.isPaused || prev.gameCompleted || prev.gameOver) return prev;
        return { ...prev, elapsedMs: startTimeRef.current != null ? Date.now() - startTimeRef.current : prev.elapsedMs };
      });
    }, TIMER_TICK_MS);
    return () => clearInterval(id);
  }, [isPaused, gameCompleted, gameOver]);

  // ── Gravity drop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused || gameCompleted || gameOver) return;
    const id = setInterval(() => {
      const gs = gsRef.current;
      if (gs.isPaused || gs.gameCompleted || gs.gameOver) return;
      if (!checkCollision(gs.board, gs.piece, gs.pos.x, gs.pos.y + 1)) {
        setGameState(prev => ({ ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } }));
      } else {
        lockAndAdvance(gs.board, gs.piece, gs.pos, gs.lines, gs.elapsedMs);
      }
    }, DROP_SPEED_MS);
    return () => clearInterval(id);
  }, [isPaused, gameCompleted, gameOver, lockAndAdvance]);

  // ── Actions exposed to keyboard / buttons ─────────────────────────────────
  const moveLeft = useCallback(() => {
    const gs = gsRef.current;
    if (gs.isPaused || gs.gameCompleted || gs.gameOver) return;
    if (!checkCollision(gs.board, gs.piece, gs.pos.x - 1, gs.pos.y)) {
      setGameState(prev => ({ ...prev, pos: { ...prev.pos, x: prev.pos.x - 1 } }));
    }
  }, []);

  const moveRight = useCallback(() => {
    const gs = gsRef.current;
    if (gs.isPaused || gs.gameCompleted || gs.gameOver) return;
    if (!checkCollision(gs.board, gs.piece, gs.pos.x + 1, gs.pos.y)) {
      setGameState(prev => ({ ...prev, pos: { ...prev.pos, x: prev.pos.x + 1 } }));
    }
  }, []);

  const softDrop = useCallback(() => {
    const gs = gsRef.current;
    if (gs.isPaused || gs.gameCompleted || gs.gameOver) return;
    if (!checkCollision(gs.board, gs.piece, gs.pos.x, gs.pos.y + 1)) {
      setGameState(prev => ({ ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } }));
    } else {
      lockAndAdvance(gs.board, gs.piece, gs.pos, gs.lines, gs.elapsedMs);
    }
  }, [lockAndAdvance]);

  const doHardDrop = useCallback(() => {
    const gs = gsRef.current;
    if (gs.isPaused || gs.gameCompleted || gs.gameOver) return;
    const dist = hardDropDistance(gs.board, gs.piece, gs.pos);
    const droppedPos = { ...gs.pos, y: gs.pos.y + dist };
    lockAndAdvance(gs.board, gs.piece, droppedPos, gs.lines, gs.elapsedMs);
  }, [lockAndAdvance]);

  const rotatePiece = useCallback((direction: 1 | -1) => {
    const gs = gsRef.current;
    if (gs.isPaused || gs.gameCompleted || gs.gameOver) return;
    const times = direction === 1 ? 1 : 3;
    let rotated = gs.piece.shape;
    for (let i = 0; i < times; i++) rotated = rotate(rotated);
    const rotatedPiece = { ...gs.piece, shape: rotated };

    // Wall-kick: try 0, -1, +1, -2, +2 offsets
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!checkCollision(gs.board, rotatedPiece, gs.pos.x + kick, gs.pos.y)) {
        setGameState(prev => ({
          ...prev,
          piece: rotatedPiece,
          pos: { ...prev.pos, x: prev.pos.x + kick },
        }));
        return;
      }
    }
  }, []);

  // ── Key repeat helper ─────────────────────────────────────────────────────
  const startRepeat = useCallback((key: string, action: () => void) => {
    if (activeKeysRef.current.has(key)) return;
    activeKeysRef.current.add(key);
    action();
    const timeout = setTimeout(() => {
      const interval = setInterval(action, HOLD_REPEAT_RATE);
      holdTimersRef.current.set(key + '_interval', interval);
    }, HOLD_INITIAL_DELAY);
    holdTimersRef.current.set(key, timeout);
  }, []);

  const stopRepeat = useCallback((key: string) => {
    activeKeysRef.current.delete(key);
    const timeout = holdTimersRef.current.get(key);
    if (timeout != null) { clearTimeout(timeout as ReturnType<typeof setTimeout>); holdTimersRef.current.delete(key); }
    const interval = holdTimersRef.current.get(key + '_interval');
    if (interval != null) { clearInterval(interval as ReturnType<typeof setInterval>); holdTimersRef.current.delete(key + '_interval'); }
  }, []);

  // ── Keyboard handler ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key) {
        case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); startRepeat('left',  moveLeft);   break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); startRepeat('right', moveRight);  break;
        case 'ArrowDown':  case 's': case 'S': e.preventDefault(); startRepeat('down',  softDrop);   break;
        case 'ArrowUp':    case ' ':            e.preventDefault(); doHardDrop();                     break;
        case 'o': case 'O':                     e.preventDefault(); rotatePiece(-1);                  break;
        case 'p': case 'P':                     e.preventDefault(); rotatePiece(1);                   break;
        default: break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':  case 'a': case 'A': stopRepeat('left');  break;
        case 'ArrowRight': case 'd': case 'D': stopRepeat('right'); break;
        case 'ArrowDown':  case 's': case 'S': stopRepeat('down');  break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [moveLeft, moveRight, softDrop, doHardDrop, rotatePiece, startRepeat, stopRepeat]);

  // ── Restart / Pause ───────────────────────────────────────────────────────
  const restartGame = () => {
    gameCompletedRef.current = false;
    scoreSavedRef.current = false;
    holdTimersRef.current.forEach((t, k) => {
      if (k.includes('interval')) clearInterval(t as ReturnType<typeof setInterval>);
      else clearTimeout(t as ReturnType<typeof setTimeout>);
    });
    holdTimersRef.current.clear();
    activeKeysRef.current.clear();
    startTimeRef.current = Date.now();
    const state = initialGameState();
    setGameState({ ...state, isPaused: false });
  };

  const togglePause = () => {
    setGameState(prev => {
      if (prev.gameCompleted || prev.gameOver) return prev;
      if (prev.isPaused) {
        startTimeRef.current = Date.now() - prev.elapsedMs;
        return { ...prev, isPaused: false };
      }
      return { ...prev, isPaused: true };
    });
  };

  // ── Render board ──────────────────────────────────────────────────────────
  const renderBoard = () => {
    // Build a display board with the active piece painted on
    const display: string[][] = board.map((row) =>
      row.map((cell) => (cell[1] === "clear" ? "black" : cell[0]))
    );
    piece.shape.forEach((row, py) =>
      row.forEach((cell, px) => {
        if (cell !== 0) {
          const ny = pos.y + py;
          const nx = pos.x + px;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
            display[ny][nx] = piece.color;
          }
        }
      })
    );

    // Ghost piece
    const ghostDist = hardDropDistance(board, piece, pos);
    piece.shape.forEach((row, py) =>
      row.forEach((cell, px) => {
        if (cell !== 0) {
          const ny = pos.y + ghostDist + py;
          const nx = pos.x + px;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && display[ny][nx] === 'black') {
            display[ny][nx] = 'ghost';
          }
        }
      })
    );

    const cs = cellSize;
    return display.map((row, y) =>
      row.map((color, x) => (
        <div
          key={`${y}-${x}`}
          className="tetris-cell"
          style={{
            width: cs,
            height: cs,
            backgroundColor: color === 'ghost' ? 'transparent' : color,
            border: color === 'ghost'
              ? `1px solid ${piece.color}55`
              : color === 'black'
              ? '1px solid #111'
              : '1px solid rgba(255,255,255,0.18)',
            boxSizing: 'border-box',
          }}
        />
      ))
    );
  };

  // Track whether the last interaction was touch, to suppress the synthetic
  // mouse events that mobile browsers fire after touchend (~300 ms later).
  const lastWasTouchRef = useRef(false);

  const touchGuard = (action: () => void) => (e: React.TouchEvent) => {
    e.preventDefault();           // suppress the synthetic mouse/click events
    lastWasTouchRef.current = true;
    action();
  };

  const mouseGuard = (action: () => void) => () => {
    if (lastWasTouchRef.current) {
      // Reset flag so the next genuine mouse interaction works normally
      lastWasTouchRef.current = false;
      return;
    }
    action();
  };

  // ── Mobile controls ───────────────────────────────────────────────────────
  // ── Mobile controls ───────────────────────────────────────────────────────
  // Layout (8 cols x 3 rows):
  //   A A D D O O P P
  //   A A D D O O P P
  //   S S S S O O P P
  const renderMobileControls = () => (
    <Box sx={{
	  display: 'grid',
      gridTemplateColumns: 'repeat(8, 1fr)',
      gridTemplateRows: 'repeat(3, 64px)',
      gap: '4px',
      width: '100vw',
      position: 'relative',
      left: '50%',
      right: '50%',
      marginLeft: '-50vw',
      marginRight: '-50vw',
      px: '6px',
      boxSizing: 'border-box',
      mt: 1,
    }}>
      <Button variant="contained"
        onTouchStart={(e) => { e.preventDefault(); lastWasTouchRef.current = true; startRepeat('ml', moveLeft); }}
        onTouchEnd={() => stopRepeat('ml')}
        onMouseDown={mouseGuard(() => startRepeat('ml', moveLeft))}
        onMouseUp={() => stopRepeat('ml')}
        onMouseLeave={() => stopRepeat('ml')}
        sx={{ ...mobileBtnStyle, gridColumn: '1 / 3', gridRow: '1 / 3' }}
      >◀</Button>

      <Button variant="contained"
        onTouchStart={(e) => { e.preventDefault(); lastWasTouchRef.current = true; startRepeat('mr', moveRight); }}
        onTouchEnd={() => stopRepeat('mr')}
        onMouseDown={mouseGuard(() => startRepeat('mr', moveRight))}
        onMouseUp={() => stopRepeat('mr')}
        onMouseLeave={() => stopRepeat('mr')}
        sx={{ ...mobileBtnStyle, gridColumn: '3 / 5', gridRow: '1 / 3' }}
      >▶</Button>

      <Button variant="contained"
        onTouchStart={(e) => { e.preventDefault(); lastWasTouchRef.current = true; startRepeat('md', softDrop); }}
        onTouchEnd={() => stopRepeat('md')}
        onMouseDown={mouseGuard(() => startRepeat('md', softDrop))}
        onMouseUp={() => stopRepeat('md')}
        onMouseLeave={() => stopRepeat('md')}
        sx={{ ...mobileBtnStyle, gridColumn: '1 / 5', gridRow: '3 / 4' }}
      >▼</Button>

      <Button variant="contained"
        onTouchStart={touchGuard(() => rotatePiece(-1))}
        onMouseDown={mouseGuard(() => rotatePiece(-1))}
        sx={{ ...mobileRotateStyle, gridColumn: '5 / 7', gridRow: '1 / 4' }}
      >↺</Button>

      <Button variant="contained"
        onTouchStart={touchGuard(() => rotatePiece(1))}
        onMouseDown={mouseGuard(() => rotatePiece(1))}
        sx={{ ...mobileRotateStyle, gridColumn: '7 / 9', gridRow: '1 / 4' }}
      >↻</Button>
    </Box>
  );

  const cs = cellSize;
  const boardWidth = cs * COLS;
  const boardHeight = cs * ROWS;

  return (
    <Box className={`tetris-container ${isMobile ? 'mobile' : ''}`}
      sx={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <MainMenu />

      {/* ── Arcade cabinet wrapper ── */}
      <Box ref={gameContainerRef} sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: 520,
        px: 1,
        pb: 2,
      }}>

        {/* Title bar */}
        <Box sx={{
          width: '100%',
          textAlign: 'center',
          py: 0.5,
          mb: 0.5,
          background: 'linear-gradient(90deg, #1a1a2e, #16213e, #1a1a2e)',
          borderBottom: '2px solid #00ffcc',
          letterSpacing: 6,
        }}>
          <Typography sx={{
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: isMobile ? 12 : 16,
            color: '#00ffcc',
            textShadow: '0 0 10px #00ffcc, 0 0 20px #00ffcc',
          }}>
            TETRIS
          </Typography>
        </Box>

        {/* Stats bar */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          width: boardWidth,
          px: 0.5,
          mb: 0.5,
        }}>
          <Typography sx={statStyle}>
            LINES: {Math.min(lines, LINES_TARGET)}/{LINES_TARGET}
          </Typography>
          <Typography sx={statStyle}>
            TIME: {formatTimeMs(elapsedMs)}
          </Typography>
        </Box>

        {/* Status messages */}
        {gameCompleted && (
          <Typography sx={{ ...statusStyle, color: '#00ffcc', textShadow: '0 0 8px #00ffcc' }}>
            ★ COMPLETE: {formatTimeMs(elapsedMs)} ★
          </Typography>
        )}
        {gameOver && (
          <Typography sx={{ ...statusStyle, color: '#ff3030', textShadow: '0 0 8px #ff3030' }}>
            GAME OVER
          </Typography>
        )}
        {isPaused && !gameCompleted && !gameOver && (
          <Typography sx={{ ...statusStyle, color: '#ffcc00', textShadow: '0 0 8px #ffcc00' }}>
            PAUSED
          </Typography>
        )}

        {/* Menu buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setShowGame(v => !v)} sx={menuBtnStyle}>
            {showGame ? 'SCORES' : 'PLAY'}
          </Button>
          <Button size="small" variant="outlined" onClick={restartGame} sx={menuBtnStyle}>
            RESTART
          </Button>
          <Button size="small" variant="outlined"
            onClick={togglePause}
            disabled={gameCompleted || gameOver}
            sx={menuBtnStyle}
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </Button>
        </Box>

        {/* ── Board ── */}
        {showGame && (
          <>
            <Box sx={{
              width: boardWidth,
              height: boardHeight,
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, ${cs}px)`,
              border: '3px solid #00ffcc',
              boxShadow: '0 0 18px #00ffcc55, inset 0 0 30px #00001a',
              background: '#000010',
              userSelect: 'none',
            }}>
              {renderBoard()}
            </Box>

            <Box className="mobile-only">
              {renderMobileControls()}
            </Box>

            <Box className="desktop-only" sx={{ mt: 1, textAlign: 'center' }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: 10, color: '#555', letterSpacing: 1 }}>
                A/◀ MOVE LEFT &nbsp;|&nbsp; D/▶ MOVE RIGHT &nbsp;|&nbsp; S/▼ SOFT DROP &nbsp;|&nbsp; ↑/SPACE HARD DROP &nbsp;|&nbsp; O ROTATE ↺ &nbsp;|&nbsp; P ROTATE ↻
              </Typography>
            </Box>
          </>
        )}

        {/* ── Leaderboard ── */}
        {!showGame && (
          <Box sx={{
            width: boardWidth,
            background: '#060610',
            border: '2px solid #00ffcc44',
            p: 2,
          }}>
            <Typography sx={{ ...statStyle, textAlign: 'center', mb: 1, color: '#00ffcc' }}>
              ─ BEST TIMES ─
            </Typography>
            {topScores.length === 0 ? (
              <Typography sx={{ ...statStyle, textAlign: 'center', color: '#444' }}>NO SCORES YET</Typography>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 11, color: '#ccc' }}>
                <thead>
                  <tr>
                    {['#', 'USER', 'TIME', 'LINES'].map(h => (
                      <th key={h} style={{ color: '#00ffcc', textAlign: 'left', paddingBottom: 6, borderBottom: '1px solid #00ffcc44' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...topScores]
                    .sort((a, b) => a.timeMs - b.timeMs)
                    .slice(0, 10)
                    .map((entry, i) => (
                      <tr key={`${entry.name}-${entry.timeMs}-${i}`} style={{ color: i === 0 ? '#ffcc00' : '#aaa' }}>
                        <td style={{ padding: '3px 6px 3px 0' }}>{i + 1}</td>
                        <td style={{ padding: '3px 6px' }}>{entry.name}</td>
                        <td style={{ padding: '3px 6px' }}>{formatTimeMs(entry.timeMs)}</td>
                        <td style={{ padding: '3px 6px' }}>{entry.linesTarget}</td>
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

// ── Shared style objects ──────────────────────────────────────────────────────

const statStyle = {
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontSize: 9,
  color: '#aaffcc',
  letterSpacing: 1,
};

const statusStyle = {
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontSize: 11,
  mb: 0.5,
  letterSpacing: 2,
};

const menuBtnStyle = {
  fontFamily: '"Press Start 2P", "Courier New", monospace',
  fontSize: 8,
  color: '#00ffcc',
  borderColor: '#00ffcc55',
  letterSpacing: 1,
  py: 0.5,
  px: 1,
  minWidth: 0,
  '&:hover': { borderColor: '#00ffcc', background: '#00ffcc11' },
  '&:disabled': { color: '#333', borderColor: '#222' },
};

const mobileBtnStyle = {
  width: '100%',
  height: '100%',
  minWidth: 0,
  fontSize: 28,
  background: '#1a1a2e',
  color: '#00ffcc',
  border: '2px solid #00ffcc55',
  borderRadius: '8px',
  '&:hover': { background: '#00ffcc22' },
  '&:active': { background: '#00ffcc44' },
};

const mobileRotateStyle = {
  ...mobileBtnStyle,
  fontSize: 26,
  color: '#ffcc00',
  border: '2px solid #ffcc0055',
  '&:hover': { background: '#ffcc0022' },
  '&:active': { background: '#ffcc0044' },
};

export default Tetris;