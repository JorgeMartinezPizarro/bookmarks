'use client';

import MainMenu from "@/app/components/MainMenu";
import { TextField, Button, InputLabel } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const Wording = () => {
  const [word, setWord] = useState("");
  const [score, setScore] = useState(0);
  const [text, setText] = useState("");
  const [showWord, setShowWord] = useState(true);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showScores, setShowScores] = useState(true); // true = juego, false = scores
  const [topScores, setTopScores] = useState<any[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  // ====== NUEVO ENDPOINT: guardar score ======
  const saveScore = useCallback(async () => {
    if (scoreSaved) return;
    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: 4,
          username: "player",
          score: score,
          gameConfig: { time: 60 } // o el tiempo inicial
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

  // ====== NUEVO ENDPOINT: cargar scores ======
  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/api/scores?gameId=4");
      const data = await response.json();
      if (data.scores) {
        setTopScores(
          data.scores.map((s: any) => ({
            score: s.score,
            name: s.username,
            time: s.gameConfig?.time || 0,
            createdAt: s.createdAt,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  }, []);

  // ====== Obtener palabra ======
  const requestWord = useCallback(() => {
    if (playing) {
      fetch("/word")
        .then((a) => a.json())
        .then((a) => setWord(a.word));
    } else {
      setWord("");
    }
  }, [playing]);

  // ====== Efecto para el audio ======
  useEffect(() => {
    const audio = document.getElementsByTagName("audio")[0] as HTMLAudioElement;
    if (playing) audio?.play();
  }, [word, playing]);

  // ====== Temporizador ======
  useEffect(() => {
    if (playing) {
      setTime(60);
      setScore(0);
      setScoreSaved(false);
    }

    let interval: NodeJS.Timeout | null = null;
    if (playing) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            // Fin del juego
            setPlaying(false);
            saveScore(); // Guardar automáticamente al terminar
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

  // ====== Pedir palabra al cambiar estado ======
  useEffect(() => {
    requestWord();
  }, [requestWord]);

  // ====== Cargar scores al montar ======
  useEffect(() => {
    loadScores();
  }, [loadScores]);

  // ====== Manejo de envío de palabra ======
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
        height: "100%",
        verticalAlign: "middle",
        margin: "auto",
        width: "320px",
        color: "white",
        textAlign: "center",
      }}
    >
      <MainMenu />

      {/* Botón para alternar entre juego y scores */}
      <Button
        className="game-menu"
        variant="contained"
        onClick={() => setShowScores(!showScores)}
        style={{ marginBottom: "16px" }}
      >
        {showScores ? "Scores" : "Play"}
      </Button>

      {showScores ? (
        // ====== VISTA DEL JUEGO ======
        <>
          <InputLabel style={{ lineHeight: "54px", height: "54px" }}>
            {!playing ? "Let's play!" : showWord ? word : "Hidden"}
          </InputLabel>

          <TextField
            color={word === text ? "primary" : "error"}
            onKeyDown={(event) => {
              if (event.key === "Enter" && text === word) {
                handleSubmitWord();
              }
            }}
            style={{ background: "white", height: "54px" }}
            value={text}
            onChange={(e: any) => setText(e.target.value)}
            disabled={!playing}
          />
          <br />

          <div>
            <Button
              style={{
                margin: "0 8px",
                height: "54px",
                background: "grey",
                padding: "8px",
                borderRadius: "4px",
              }}
              variant="contained"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? "STOP" : "PLAY"}
            </Button>
            <Button
              style={{
                margin: "0 8px",
                height: "54px",
                background: "grey",
                padding: "8px",
                borderRadius: "4px",
              }}
              variant="contained"
              onClick={() => setShowWord(!showWord)}
            >
              {!showWord ? "SHOW" : "HIDE"}
            </Button>
            <Button
              style={{
                margin: "0 8px",
                height: "54px",
                background: "grey",
                padding: "8px",
                borderRadius: "4px",
              }}
              variant="contained"
              type="submit"
              onClick={handleSubmitWord}
              disabled={!playing}
            >
              Check
            </Button>
          </div>

          <p>
            {score + " correct words, remaining " + time + "s"}
          </p>
          <br />

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
        </>
      ) : (
        // ====== VISTA DE SCORES ======
        <>
          <h4>Highest scores</h4>
          {topScores.length === 0 ? (
            <p>No scores yet</p>
          ) : (
            <table style={{ width: "70%", border: "2px solid white", color: "white", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "6px", border: "1px solid white" }}>Pos</th>
                  <th style={{ padding: "6px", border: "1px solid white" }}>User</th>
                  <th style={{ padding: "6px", border: "1px solid white" }}>Words</th>
                  <th style={{ padding: "6px", border: "1px solid white" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {topScores
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 10)
                  .map((s, i) => (
                    <tr key={i}>
                      <td style={{ padding: "6px", border: "1px solid white" }}>{i + 1}</td>
                      <td style={{ padding: "6px", border: "1px solid white" }}>{s.name}</td>
                      <td style={{ padding: "6px", border: "1px solid white" }}>{s.score}</td>
                      <td style={{ padding: "6px", border: "1px solid white" }}>{s.time}s</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default Wording;