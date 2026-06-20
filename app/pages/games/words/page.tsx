'use client';

import MainMenu from "@/app/components/MainMenu";
import { TextField, Button } from "@mui/material";
import { useCallback, useEffect, useState, useRef } from "react";
import "./styles.css";

const WORDS_TOTAL = 10;

type ScoreEntry = {
  score: number;
  name: string;
  wordsTotal: number;
  createdAt?: string;
};

const Wording = () => {
  const [word, setWord] = useState("");
  const [score, setScore] = useState(0);
  const [text, setText] = useState("");
  const [showWord, setShowWord] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showScores, setShowScores] = useState(true);
  const [topScores, setTopScores] = useState<ScoreEntry[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [finished, setFinished] = useState(false);

  // NUEVO: tiempo logrado y puesto en el ranking al terminar la partida
  const [finishedTime, setFinishedTime] = useState<number | null>(null);
  const [finishedRank, setFinishedRank] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadScores = useCallback(async (): Promise<ScoreEntry[]> => {
    try {
      const response = await fetch("/bookmarks/api/scores?gameId=4");
      const data = await response.json();

      if (data.scores) {
        const mapped: ScoreEntry[] = data.scores.map((s: any) => ({
          score: s.score,
          name: s.username,
          wordsTotal: s.gameConfig?.wordsTotal || WORDS_TOTAL,
          createdAt: s.createdAt,
        }));
        setTopScores(mapped);
        return mapped;
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
    return [];
  }, []);

  const saveScore = useCallback(async () => {
    if (scoreSaved) return;

    const elapsed = Date.now() - startTimeRef.current;
    setFinishedTime(elapsed);

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
        const updated = await loadScores();

        // Calculamos el puesto (menor tiempo = mejor puesto), solo cuenta si está en el top 10
        const sorted = [...updated].sort((a, b) => a.score - b.score);
        const idx = sorted.findIndex((s) => s.score === elapsed);
        setFinishedRank(idx >= 0 && idx < 10 ? idx + 1 : null);

        // Mostramos automáticamente el marcador con la partida recién jugada
        setShowScores(false);
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }, [scoreSaved, loadScores]);

  const saveScoreRef = useRef(saveScore);

  useEffect(() => {
    saveScoreRef.current = saveScore;
  }, [saveScore]);

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

  // RESET PARTIDA
  useEffect(() => {
    if (playing) {
      setScore(0);
      setScoreSaved(false);
      setFinished(false);
      setFinishedTime(null);
      setFinishedRank(null);
      startTimeRef.current = Date.now();
    }
  }, [playing]);

  // Foco automático al empezar
  useEffect(() => {
    if (playing) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
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
        setFinished(true);
        saveScoreRef.current();
        return;
      }

      requestWord();
    }
  };

  const elapsedMs = playing ? Date.now() - startTimeRef.current : 0;

  const sortedScores = [...topScores].sort((a, b) => a.score - b.score).slice(0, 10);

  return (
    <div className="wording-page">
      <MainMenu />

      <Button
        className="toggle-view-btn"
        variant="contained"
        onClick={() => setShowScores(!showScores)}
      >
        {showScores ? "Ver Puntuaciones" : "Jugar"}
      </Button>

      {showScores ? (
        <div className="panel">
          <h2 className="panel-title">
            {!playing && finished
              ? "🎉 Partida finalizada"
              : !playing
              ? "👋 Bienvenido"
              : showWord
              ? word
              : "Oculta"}
          </h2>

          <TextField
            inputRef={inputRef}
            color={word === text ? "primary" : "error"}
            onKeyDown={(event) => {
              if (event.key === "Enter" && text === word) {
                handleSubmitWord();
              }
            }}
            className="word-input"
            value={text}
            onChange={(e: any) => setText(e.target.value)}
            disabled={!playing}
            placeholder="Escribe la palabra aquí..."
          />

          <div className="button-row">
            <Button
              className={`action-btn ${playing ? "action-btn--play" : "action-btn--stopped"}`}
              variant="contained"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? "DETENER" : "JUGAR"}
            </Button>

            <Button
              className="action-btn action-btn--neutral"
              variant="contained"
              onClick={() => setShowWord(!showWord)}
            >
              {!showWord ? "MOSTRAR" : "OCULTAR"}
            </Button>

            <Button
              className="action-btn action-btn--submit"
              variant="contained"
              onClick={handleSubmitWord}
              disabled={!playing}
            >
              ✓
            </Button>
          </div>

          <p className="stats-line">
            Palabras: <strong>{score}</strong> / {WORDS_TOTAL} | Tiempo:{" "}
            <strong>{elapsedMs} ms</strong>
          </p>

          {word !== "" && (
            <audio key={word} className="hidden-audio" controls>
              <source
                src={"/bookmarks/api/audio?file=" + word + ".mp3"}
                type="audio/mpeg"
              />
            </audio>
          )}
        </div>
      ) : (
        <div className="scoreboard-panel">
          <h3 className="scoreboard-title">Mejores Tiempos</h3>

          {finished && finishedTime !== null && (
            <div className="finished-summary">
              <div className="finished-summary__time">
                ⏱ Tu tiempo: {finishedTime} ms
              </div>
              {finishedRank !== null ? (
                <p className="finished-summary__rank">
                  🏆 ¡Puesto #{finishedRank} del top 10!
                </p>
              ) : (
                <p className="finished-summary__rank finished-summary__rank--outside">
                  No has entrado en el top 10 esta vez.
                </p>
              )}
            </div>
          )}

          {sortedScores.length === 0 ? (
            <p className="no-scores">No hay puntuaciones aún</p>
          ) : (
            <table className="scoreboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Tiempo (ms)</th>
                </tr>
              </thead>
              <tbody>
                {sortedScores.map((s, i) => {
                  const isHighlighted =
                    finished &&
                    finishedTime !== null &&
                    finishedRank !== null &&
                    i + 1 === finishedRank &&
                    s.score === finishedTime;

                  return (
                    <tr
                      key={i}
                      className={isHighlighted ? "scoreboard-row--highlight" : undefined}
                    >
                      <td>{i + 1}</td>
                      <td>{s.name}</td>
                      <td>{s.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Wording;