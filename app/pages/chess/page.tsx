"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button, Tooltip } from "@mui/material";

// Cargar Chessboardjsx dinámicamente sin SSR
const Chessboard = dynamic(() => import("chessboardjsx"), { ssr: false });

let Chess: any = null;

const ChessGame: React.FC = () => {
  const [game, setGame] = useState<any>(null);
  const [fen, setFen] = useState("start");
  const [logs, setLogs] = useState<string[]>([])
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Cargar chess.js dinámicamente
    import("chess.js").then((module) => {
      Chess = module.Chess;
      setGame(new Chess());
    });
  }, []);

  const makeAIMove = async () => {
    if (!game) {
      return;
    }
  
    const fen = game.fen(); // Obtenemos el estado actual del tablero
    const response = await fetch("/bookmarks/api/chess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen }), // Mandamos solo el FEN
    });
  
    const data = await response.json();
    

    setLogs([
      ...logs,
      "Request\n" +
      data.request + "\n" +
      "Response\n" +
      data.response + "\n"

    ])
    if (data.bestmove) {
      const from = data.bestmove.slice(0, 2);
      const to = data.bestmove.slice(2, 4);
  
      game.move({ from, to });
      setFen(game.fen());
    }
  };

  const handleCopy = () => {
    const script = JSON.stringify(logs)
		navigator.clipboard.writeText(script).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000); // Reset tooltip after 2 seconds
		});
	};

  const onDrop = async ({ sourceSquare, targetSquare }: any) => {
    if (!game) return;

    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move) {
      setFen(game.fen());
      await makeAIMove();
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      textAlign: "center",
    }}>
      {game && <Chessboard position={fen} onDrop={onDrop} width={400} />}
      <Button
        onClick={() => {
          if (game) {
            game.reset();
            setFen("start");
          }
          setLogs([])
        }}
        variant="contained"
        color="primary"
      >
        Reiniciar Juego
      </Button>
      <Tooltip title={copied ? "Copied!" : "Copy to clipboard"} arrow>
      <Button
        variant="contained"
        color="primary"
        onClick={handleCopy}
		disabled={logs.length === 0}
        startIcon={<ContentCopyIcon />}
      >
        Copy
      </Button>
	</Tooltip>
    </div>
  );
};

export default ChessGame;
