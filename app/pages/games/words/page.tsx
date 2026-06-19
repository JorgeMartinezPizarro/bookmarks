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
  const [finished, setFinished] = useState(false);
  const [topScores, setTopScores] = useState<any[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);

  const startTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

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
        setTopScores(data.scores);
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  }, []);

  const requestWord = useCallback(() => {
    if (playing) {
      fetch("/word")
        .then((r) => r.json())
        .then((r) => setWord(r.word));
    } else {
      setWord("");
    }
  }, [playing]);

  useEffect(() => {
    if (playing) {
      setScore(0);
      setFinished(false);
      setScoreSaved(false);
      startTimeRef.current = Date.now();
    }
  }, [playing]);

  useEffect(() => {
    if (playing) {
      inputRef.current?.focus();
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
        setFinished(true);
        setPlaying(false);
        saveScoreRef.current();
        return;
      }

      requestWord();
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

      <Button
        variant="contained"
        onClick={() => setPlaying(!playing)}
        style={{
          marginBottom: "20px",
          backgroundColor: "#16213e",
          color: "white",
          fontWeight: "bold"
        }}
      >
        {playing ? "DETENER" : "JUGAR"}
      </Button>

      <div
        style={{
          backgroundColor: "#16213e",
          padding: "30px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", color: "#e94560" }}>
          {finished
            ? "🏁 Partida finalizada"
            : !playing
              ? "¡Preparado!"
              : showWord
                ? word
                : "Oculta"}
        </h2>

        <TextField
          inputRef={inputRef}
          value={text}
          onChange={(e: any) => setText(e.target.value)}
          disabled={!playing}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmitWord();
          }}
          placeholder="Escribe la palabra..."
          style={{
            background: "white",
            borderRadius: "8px",
            width: "100%",
            marginBottom: "20px"
          }}
        />

        <div style={{ marginBottom: "20px" }}>
          <Button
            variant="contained"
            onClick={() => setShowWord(!showWord)}
            style={{ backgroundColor: "#0f3460", color: "white" }}
          >
            {showWord ? "OCULTAR" : "MOSTRAR"}
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmitWord}
            disabled={!playing}
            style={{
              marginLeft: "10px",
              backgroundColor: "#e94560",
              color: "white"
            }}
          >
            ✓
          </Button>
        </div>

        <p>
          Palabras: <strong>{score}</strong> / {WORDS_TOTAL}
        </p>
      </div>

      {/* SCOREBOARD SIMPLE */}
      <div
        style={{
          marginTop: "20px",
          backgroundColor: "#16213e",
          padding: "20px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px"
        }}
      >
        <h3 style={{ color: "#e94560" }}>Mejores tiempos</h3>

        {topScores.length === 0 ? (
          <p style={{ color: "#888" }}>Sin datos aún</p>
        ) : (
          <ol style={{ color: "white", textAlign: "left" }}>
            {topScores
              .sort((a, b) => a.score - b.score)
              .slice(0, 10)
              .map((s, i) => (
                <li key={i}>
                  {s.score} ms
                </li>
              ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default Wording;