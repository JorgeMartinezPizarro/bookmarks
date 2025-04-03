"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button, Tooltip, TextField, Typography, Box, Slider } from "@mui/material";
import { Chess } from "chess.js";
import MainMenu from "@/app/components/MainMenu";

// Cargar Chessboardjsx dinámicamente sin SSR
const Chessboard = dynamic(() => import("chessboardjsx"), { ssr: false });

const ChessGame: React.FC = () => {
  const [game, setGame] = useState<Chess | null>(null);
  const [fen, setFen] = useState("start");
  const [logs, setLogs] = useState<string[]>([])
  const [copied, setCopied] = useState(false);
  const [elo, setElo] = useState(800);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [topScores, setTopScores] = useState<any>([])
  const [scores, setScores] = useState(true)  

  const handleChange = (event: any) => {
    setElo(event.target.value);
  };


  const makeAIMove = async () => {
    if (!game || gameResult) {
      return;
    }
  
    const fen = game.fen(); // Obtenemos el estado actual del tablero
    const response = await fetch("/bookmarks/api/chess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        fen,
        elo
       }), // Mandamos solo el FEN
    });
  
    const data = await response.json();
  
    setLogs([
      ...logs,
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
  
      // Verificar si el juego terminó después del movimiento de la IA
      checkGameOver();
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
    if (!game || gameResult) return;
  
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Promoción por dama en caso de peones
      });
    
      if (move) {
        setFen(game.fen());
    
        // Verificar si el juego terminó después del movimiento del usuario
        checkGameOver();
    
        if (!game.isGameOver()) {
          await makeAIMove();
        } else {
          fetch("/bookmarks/api/form", {
            method: "POST",
            body: JSON.stringify({ 
              form: 2, // form to save the progress
              answers: {
                6: [elo],
                7: [25000], // TODO: use actual time
              },
              user: 8
            }),
          }).then(a => a.json()).then(a => loadScores())
        }
      }
    } catch (e) {

    }
  };

  const loadScores = useCallback(() => {
      fetch("/bookmarks/api/form?formId=2").then(a => a.json()).then(a => {
        const topScores = a.ocs.data.submissions.map((e: any) => {
          
          return {
            elo: e.answers[0].text,
            time: e.answers[1].text,
            name: e.answers[2].text
          }
        })
        setTopScores(topScores)
      })
    }, [setTopScores])

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

  
  useEffect(() => {
    // Cargar chess.js dinámicamente
    loadScores()
    import("chess.js").then((module) => {
      setGame(new Chess());
    });
  }, [loadScores, setGame]);

  return (<>
    <MainMenu />
    <Button className="game-menu" variant="contained" onClick={() => setScores(!scores)}>{!scores ? "Play" : "Scores"}</Button>
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "calc(100vh - 40px)",
      textAlign: "center",
    }}>
      
      
      {scores && game && <Chessboard position={fen} onDrop={onDrop} width={400} />}
      {scores && game && <Button
        onClick={() => {
          if (game) {
            game.reset();
            setFen("start");
          }
          setLogs([])
          setGameResult(null); // Limpiar el resultado
        }}
        variant="contained"
        color="primary"
      >
        Restart
      </Button>}
  {scores && game && <Box>
      <Slider
        value={elo}
        onChange={(e: any) => handleChange(e)}
        min={800}
        max={2200}
        step={1} // Incremento entre valores
        valueLabelDisplay="auto" // Muestra el valor actual
        marks={[
          { value: 800, label: '800' },
          { value: 2200, label: '2200' },
        ]} // Etiquetas opcionales para los extremos
      />
      <Typography variant="body1" align="center">
        Selected elo: {elo}
      </Typography>
    </Box>}
    {scores && game && gameResult && (
      <Typography variant="h5" color="secondary" gutterBottom>
        {gameResult}
      </Typography>
    )}
    {!scores && topScores && <h4>Highest scores</h4>}
    {!scores && topScores && <table style={{width: "70%" }} border={2}><tbody>
      <tr><th>Pos</th><th>User</th><th>Elo</th><th>Time</th></tr>
      {topScores
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10)
        .map((a: any, i: number) => <tr key={i} style={{padding: ""}}>
          <td style={{padding: "6px"}}>{i+1}</td>
          <td style={{padding: "6px"}}>{a.name}</td>
          <td  style={{padding: "6px"}}>{a.elo}</td>
          <td  style={{padding: "6px"}}>{a.time}</td>
        </tr>)
      }
    </tbody></table>}
    </div>
    </>
  );
};

export default ChessGame;
