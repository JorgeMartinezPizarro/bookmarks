'use client';

import MainMenu from "@/app/components/MainMenu";
import { TextField, Button } from "@mui/material";
import { useCallback, useEffect, useState, useRef } from "react";

const WORDS_TOTAL = 10;

const Wording = () => {
  const [word, setWord] = useState("");
  const [score, setScore] = useState(0);
  const [text, setText] = useState("");
  const [showWord, setShowWord] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showScores, setShowScores] = useState(true);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  // NUEVO: estado de fin de partida
  const [finished, setFinished] = useState(false);

  const startTimeRef = useRef<number>(0);

  const saveScore = useCallback(async () => {
    if (scoreSaved) return;

    const elapsed = Date.now() - startTimeRef.current;

    try {
      const response = await fetch("/bookmarks/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: 4,
          username: "player",
          score: elapsed,
          gameConfig: { wordsTotal: WORDS_TOTAL }
        }),
      });

      if (response.ok) {
        setScoreSaved(true);
        await loadScores();
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }, [scoreSaved]);

  const saveScoreRef = useRef(saveScore);

  useEffect(() => {
    saveScoreRef.current = saveScore;
  }, [saveScore]);

  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/bookmarks/api/scores?gameId=4");
      const data = await response.json();

      if (data.scores) {
        setTopScores(
          data.scores.map((s: any) => ({
            score: s.score,
            name: s.username,
            wordsTotal: s.gameConfig?.wordsTotal || WORDS_TOTAL,
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
      setScore(0);
      setScoreSaved(false);
      setFinished(false); // reset fin
      startTimeRef.current = Date.now();
    }
  }, [playing]);

  useEffect(() => {
    requestWord();
  }, [requestWord]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const handleSubmitWord = () => {
    if (text === word && playing) {
      const next = score + 1;

      setScore(next);
      setText("");

      if (next >= WORDS_TOTAL) {
        setPlaying(false);
        setFinished(true); // NUEVO: marcar partida finalizada
        saveScoreRef.current();
        return;
      }

      requestWord();
    }
  };

  const elapsedMs = playing ? Date.now() - startTimeRef.current : 0;

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
        <div
          style={{
            backgroundColor: "#16213e",
            padding: "30px",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
          }}
        >
          <h2 style={{ margin: "0 0 20px 0", color: "#e94560" }}>
            {!playing && finished
              ? "🎉 Partida finalizada"
              : !playing
              ? "👋 Bienvenido"
              : showWord
              ? word
              : "Oculta"}
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

          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
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
              onClick={handleSubmitWord}
              disabled={!playing}
            >
              ✓
            </Button>
          </div>

          <p style={{ fontSize: "18px", margin: "0 0 10px 0" }}>
            Palabras: <strong>{score}</strong> / {WORDS_TOTAL} | Tiempo:{" "}
            <strong>{elapsedMs} ms</strong>
          </p>

          {word !== "" && (
            <audio key={word} style={{ display: "none" }} controls>
              <source
                src={"/bookmarks/api/audio?file=" + word + ".mp3"}
                type="audio/mpeg"
              />
            </audio>
          )}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#16213e",
            padding: "20px",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
          }}
        >
          <h3 style={{ color: "#e94560", margin: "0 0 20px 0" }}>
            Mejores Tiempos
          </h3>

          {topScores.length === 0 ? (
            <p style={{ color: "#888" }}>No hay puntuaciones aún</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
              <thead>
                <tr style={{ backgroundColor: "#0f3460" }}>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Tiempo (ms)</th>
                </tr>
              </thead>
              <tbody>
                {topScores
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 10)
                  .map((s, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{s.name}</td>
                      <td>{s.score}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Wording;