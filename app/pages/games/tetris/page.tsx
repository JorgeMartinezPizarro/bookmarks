'use client';

import { Box, Button, Stack, Typography } from "@mui/material";
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./style.css"

type Cell = [string, string]; // [color, state]
type Board = Cell[][];
type Piece = { shape: number[][]; color: string };
const speed = 184;
const createBoard = (rows: number, cols: number): Board =>
  Array.from(Array(rows), () => Array(cols).fill(["0", "clear"]));

const rotate = (matrix: number[][]): number[][] =>
  matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]).reverse());

const checkCollision = (board: Board, piece: Piece, x: number, y: number): boolean => {
  return piece.shape.some((row, rowIndex) =>
    row.some((cell, colIndex) => {
      if (cell !== 0) {
        const newX = x + colIndex;
        const newY = y + rowIndex;
        if (
          newY >= board.length || // Fuera del tablero vertical
          newX < 0 || // Fuera del tablero izquierda
          newX >= board[0].length || // Fuera del tablero derecha
          (newY >= 0 && board[newY][newX][1] !== "clear") // Celda ocupada
        ) {
          return true;
        }
      }
      return false;
    })
  );
};

const TETROMINOS = [
  { shape: [[1, 1, 1], [0, 1, 0]], color: "red" }, // T
  { shape: [[1, 1], [1, 1]], color: "yellow" }, // Cuadrado
  { shape: [[1, 1, 0], [0, 1, 1]], color: "green" }, // Z
  { shape: [[0, 1, 1], [1, 1, 0]], color: "blue" }, // S
  { shape: [[1, 1, 1, 1]], color: "cyan" }, // Línea
  { shape: [[1, 1, 1], [1, 0, 0]], color: "orange" }, // L
  { shape: [[1, 1, 1], [0, 0, 1]], color: "purple" }, // J
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
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0); // Contador de 60 segundos
  const isHolding = useRef(false); // Para detectar si una tecla está presionada
  const holdInterval = useRef<NodeJS.Timeout | null>(null); // Referencia al intervalo
  const [topScores, setTopScores] = useState<any>([])
  const [scores, setScores] = useState(true)  


  // Función para mover la pieza
  const movePiece = useCallback((x: number, y: number) => {
    if (!checkCollision(board, piece, pos.x + x, pos.y + y)) {
      setPos(prev => ({ x: prev.x + x, y: prev.y + y }));
    }
  }, [setPos, board, piece, pos])

  const loadScores = useCallback(() => {
    fetch("/bookmarks/api/form?formId=3").then(a => a.json()).then(a => {
      const topScores = a.ocs.data.submissions.map((e: any) => {
        return {
          lines: e.answers[0].text,
          speed: e.answers[1].text,
          name: e.answers[2].text
        }
      })
      setTopScores(topScores)
    })
  }, [setTopScores])

  const finishGame = useCallback(() => {
    // Juego terminado
    setIsPaused(true)
    fetch("/bookmarks/api/form", {
      method: "POST",
      body: JSON.stringify({ 
        form: 3, // form to save the progress
        answers: {
          9: [lines],
          10: [timer],
        },
        user: 11
      }),
    }).then(_ => loadScores())
  }, [setIsPaused, loadScores, lines, timer])

  const resetPiece = useCallback(() => {
    const newPiece = getRandomPiece();
    const initialPos = { x: 3, y: 0 }; // Posición inicial
  
    // Si hay colisión al intentar colocar una nueva pieza, termina el juego
    if (checkCollision(board, newPiece, initialPos.x, initialPos.y)) {
      finishGame()
      return;
    }
  
    // Si no hay colisión, coloca la nueva pieza
    setPiece(newPiece);
    setPos(initialPos);
  }, [board, setPiece, setPos, finishGame])

  const clearLines = useCallback(() => {
    const clearedBoard = board.filter(row => row.some(cell => cell[1] === "clear"));
    const clearedLines = board.length - clearedBoard.length;
    const newBoard = [
      ...Array(clearedLines).fill(Array(board[0].length).fill(["0", "clear"])),
      ...clearedBoard,
    ];
    setBoard(newBoard);
    setLines(lines + clearedLines);
  }, [board, setBoard, setLines, lines])

  // Función para hacer que la pieza caiga
  const dropPiece = useCallback(() => {
    if (!checkCollision(board, piece, pos.x, pos.y + 1)) {
      setPos(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      const newBoard = [...board];
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
      setBoard(newBoard);
      clearLines();
      resetPiece();
    }
  }, [board, clearLines, piece, pos, resetPiece])

  // Función para limpiar las líneas completadas
  

  // Función para reiniciar el juego
  const restartGame = () => {
    setBoard(createBoard(20, 10));
    setPiece(getRandomPiece());
    setPos({ x: 3, y: 0 });
    setLines(0);
    setIsPaused(false);
    setTimer(0); // Reiniciar el temporizador
  };

  

  
  

  // Manejar la rotación de la pieza
  const rotatePiece = useCallback((direction: number) => {
    const rotatedShape = rotate(piece.shape);
    if (!checkCollision(board, { ...piece, shape: rotatedShape }, pos.x, pos.y)) {
      setPiece({ ...piece, shape: rotatedShape });
    }
  }, [setPiece, piece, board, pos])

  
  // Temporizador
  useEffect(() => {
    if (isPaused) return;
    if (lines >= 40) {    
      finishGame()
      
      return;
    }

    const countdown = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(countdown);
  }, [isPaused, lines, finishGame, setTimer]);

  // Caída automática de la pieza
  useEffect(() => {
    if (isPaused || lines >= 40) return;
    const interval = setInterval(() => {
      dropPiece();
    }, speed);
    return () => clearInterval(interval);
  }, [isPaused, timer, board, piece, pos, dropPiece, lines]);

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
            style={{
              width: "30px",
              height: "30px",
              backgroundColor,
              border: "1px solid grey",
            }}
          />
        );
      })
    );
  };

  

  // Lógica para manejar teclas
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPaused) return;

      switch (event.key.toLowerCase()) {
        case "a": // Izquierda
          movePiece(-1, 0);
          break;
        case "d": // Derecha
          movePiece(1, 0);
          break;
        case "o": // Rotar Izquierda
          rotatePiece(-1);
          break;
        case "p": // Rotar Derecha
          rotatePiece(1);
          break;
        case "s": // Mantener presionado para bajar
          dropPiece();
        default:
          break;
      }
    };

 
    window.addEventListener("keydown", handleKeyDown);
    const holder = holdInterval.current
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (holder) {
        clearInterval(holder);
      }
    };
  }, [isPaused, board, piece, pos, dropPiece, movePiece, rotatePiece]);
  useEffect(() => {
    loadScores()
  }, [loadScores])
  return (
    <Box style={{ height: '100vh'}} display="flex" flexDirection="column" alignItems="center" gap={1}>
      {/* Primera fila: Reiniciar, Pausar, Líneas y Temporizador */}
      <Box
        display="flex"
        justifyContent="space-between"
        width="400px"
        style={{margin: "0 0 0 0"}}
      >
        <Button variant="contained" onClick={() => setScores(!scores)}>{!scores ? "Play" : "Scores"}</Button>
        <Button variant="contained" onClick={restartGame}>
          Reiniciar
        </Button>
        <Button variant="contained" onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? "Reanudar" : "Pausar"}
        </Button>
        <Typography variant="body1" margin={0}>
          {lines}
        </Typography>
      </Box>

      {/* Tablero del juego */}
      {scores && <Box
        display="grid"
        gridTemplateRows={`repeat(${board.length}, 30px)`}
        gridTemplateColumns={`repeat(${board[0].length}, 30px)`}
        style={{margin: "0 0 0 0"}}
      >
        {renderBoard()}
      </Box>}

      {/* Botones finales */}
      {scores && <Box style={{ width: "400px", maxWidth:"100%", height: '100vh'}}>
        <div style={{width: "calc(57% - 0px)", display: "inline-block"}}>
          <Button variant="contained" style={{width: "32%!important", height: "48px", padding: "0!important"}} onClick={() => movePiece(-1, 0)}>
            {"<"}
          </Button>
          <Button variant="contained" style={{width: "32%!important", height: "48px", padding: "0!important"}} onClick={() => dropPiece()}>
            {"v"}
          </Button>
          <Button variant="contained" style={{width: "32%!important", height: "48px", padding: "0!important"}} onClick={() => movePiece(1, 0)}>
            {">"}
          </Button>
        </div>
        <div style={{width: "calc(43% - 0px)", textAlign: "right", display: "inline-block"}}>
          <Button variant="contained" style={{width: "45%", height: "48px", padding: "0!important"}} onClick={() => rotatePiece(-1)}>
            O
          </Button>
          <Button variant="contained" style={{width: "45%", height: "48px", padding: "0!important"}} onClick={() => rotatePiece(1)}>
            P
          </Button>
        </div>
      </Box>}
      {!scores && topScores && <h4>Highest scores</h4>}
      {!scores && topScores && <table style={{width: "70%" }} border={2}>
      <tr><th>Pos</th><th>User</th><th>Lines</th><th>Time</th></tr>
      {topScores
        .sort((a: any, b: any) => b.lines - a.lines)
        .slice(0, 10)
        .map((a: any, i: number) => <tr key={i} style={{padding: ""}}>
          <td style={{padding: "6px"}}>{i+1}</td>
          <td style={{padding: "6px"}}>{a.name}</td>
          <td  style={{padding: "6px"}}>{a.lines}</td>
          <td  style={{padding: "6px"}}>{a.speed}</td>
        </tr>)
      }
    </table>}
    </Box>
  );
};

export default Tetris;
