'use client';

import MainMenu from "@/app/components/MainMenu";
import { TextField, Button, InputLabel } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const Wording = () => {
  const [word, setWord] = useState("");
  const [score, setScore] = useState(0);
  const [text, setText] = useState("");
  const [showWord, setShowWord] = useState(true);
  const [time, setTime] = useState(25); // Cambiado de 60 a 25
  const [playing, setPlaying] = useState(false);
  const [showScores, setShowScores] = useState(true);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  const saveScore = useCallback(async () => {
    if (scoreSaved) return;
    try {
      const response = await fetch("/bookmarks/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: 4,
          username: "player",
          score: score,
          gameConfig: { time: 25 } // Cambiado de 60 a 25
        }),
      });
      if (response.ok) {
        setScoreSaved(true);
        await loadScores();
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }, [score, scoreSaved]);

  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/bookmarks/api/scores?gameId=4");
      const data = await response.json();
      if (data.scores) {
        setTopScores(
          data.scores.map((s: any) => ({
            score: s.score,
            name: s.username,
            time: s.gameConfig?.time || 25, // Cambiado default a 25
            createdAt: s.createdAt,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  }, []);

  const requestWord = useCallback(() => {
    if (playing) {
      fetch("/word")
        .then((a) => a.json())
        .then((a) => setWord(a.word));
    } else {
      setWord("");
    }
  }, [playing]);

  useEffect(() => {
    const audio = document.getElementsByTagName("audio")[0] as HTMLAudioElement;
    if (playing) audio?.play();
  }, [word, playing]);

  useEffect(() => {
    if (playing) {
      setTime(25); // Cambiado de 60 a 25
      setScore(0);
      setScoreSaved(false);
    }

    let interval: NodeJS.Timeout | null = null;
    if (playing) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            setPlaying(false);
            saveScore();
            clearInterval(interval!);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playing, saveScore]);

  useEffect(() => {
    requestWord();
  }, [requestWord]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const handleSubmitWord = () => {
    if (text === word && playing) {
      requestWord();
      setText("");
      setScore((prev) => prev + 1);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        color: "white",
        textAlign: "center",
        backgroundColor: "#1a1a2e",
      }}
    >
      <MainMenu />

      {/* Botón para alternar entre juego y scores */}
      <Button
        className="game-menu"
        variant="contained"
        onClick={() => setShowScores(!showScores)}
        style={{ 
          marginBottom: "20px", 
          backgroundColor: "#16213e",
          color: "white",
          fontWeight: "bold"
        }}
      >
        {showScores ? "Ver Puntuaciones" : "Jugar"}
      </Button>

      {showScores ? (
        <>
          {/* Vista del juego */}
          <div style={{ 
            backgroundColor: "#16213e", 
            padding: "30px", 
            borderRadius: "12px",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ margin: "0 0 20px 0", color: "#e94560" }}>
              {!playing ? "¡Preparado!" : showWord ? word : "Oculta"}
            </h2>

            <TextField
              color={word === text ? "primary" : "error"}
              onKeyDown={(event) => {
                if (event.key === "Enter" && text === word) {
                  handleSubmitWord();
                }
              }}
              style={{ 
                background: "white", 
                borderRadius: "8px",
                marginBottom: "20px",
                width: "100%"
              }}
              value={text}
              onChange={(e: any) => setText(e.target.value)}
              disabled={!playing}
              placeholder="Escribe la palabra aquí..."
            />

            <div style={{ 
              display: "flex", 
              gap: "10px", 
              justifyContent: "center",
              marginBottom: "20px"
            }}>
              <Button
                style={{
                  backgroundColor: playing ? "#e94560" : "#0f3460",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "bold"
                }}
                variant="contained"
                onClick={() => setPlaying(!playing)}
              >
                {playing ? "DETENER" : "JUGAR"}
              </Button>
              <Button
                style={{
                  backgroundColor: "#0f3460",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "bold"
                }}
                variant="contained"
                onClick={() => setShowWord(!showWord)}
              >
                {!showWord ? "MOSTRAR" : "OCULTAR"}
              </Button>
              <Button
                style={{
                  backgroundColor: "#e94560",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "bold"
                }}
                variant="contained"
                type="submit"
                onClick={handleSubmitWord}
                disabled={!playing}
              >
                ✓
              </Button>
            </div>

            <p style={{ fontSize: "18px", margin: "0 0 10px 0" }}>
              Palabras: <strong>{score}</strong> | Tiempo: <strong>{time}s</strong>
            </p>

            {word !== "" && (
              <div>
                <audio key={word} style={{ display: "none" }} controls>
                  <source
                    src={"/bookmarks/api/audio?file=" + word + ".mp3"}
                    type="audio/mpeg"
                  />
                </audio>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Vista de scores */}
          <div style={{ 
            backgroundColor: "#16213e", 
            padding: "20px", 
            borderRadius: "12px",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{ color: "#e94560", margin: "0 0 20px 0" }}>
              Mejores Puntuaciones
            </h3>
            {topScores.length === 0 ? (
              <p style={{ color: "#888" }}>No hay puntuaciones aún</p>
            ) : (
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse", 
                color: "white" 
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#0f3460" }}>
                    <th style={{ padding: "8px", border: "1px solid #333" }}>#</th>
                    <th style={{ padding: "8px", border: "1px solid #333" }}>Usuario</th>
                    <th style={{ padding: "8px", border: "1px solid #333" }}>Palabras</th>
                    <th style={{ padding: "8px", border: "1px solid #333" }}>Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {topScores
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                    .map((s, i) => (
                      <tr key={i} style={{ 
                        backgroundColor: i % 2 === 0 ? "#1a1a2e" : "#16213e"
                      }}>
                        <td style={{ padding: "8px", border: "1px solid #333", textAlign: "center" }}>{i + 1}</td>
                        <td style={{ padding: "8px", border: "1px solid #333" }}>{s.name}</td>
                        <td style={{ padding: "8px", border: "1px solid #333", textAlign: "center" }}>{s.score}</td>
                        <td style={{ padding: "8px", border: "1px solid #333", textAlign: "center" }}>{s.time}s</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Wording;