'use client';

import MainMenu from "@/app/components/MainMenu";

import { TextField, Button, InputLabel, Box, Typography, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { useCallback, useEffect, useState } from "react";



const Wording = () => {
  const [word, setWord] = useState("")
  const [score, setScore] = useState(0)
  const [text, setText] = useState("")
  const [showWord, setShowWord] = useState(true)

  const [time, setTime] = useState(40)
  const [playing, setPlaying] = useState(false)
  const [showScores, setShowScores] = useState(false)
  const [topScores, setTopScores] = useState<any[]>([])
  const [scoreSaved, setScoreSaved] = useState(false)

  const requestWord = useCallback(() => {





    if (playing) {
      fetch("/word")
        .then(a => a.json())
        .then(a => setWord(a.word))
        .catch(() => setWord("error"))
    } else {
      setWord("")
    }
  }, [setWord, playing])









  const loadScores = useCallback(async () => {
    try {
      const response = await fetch("/bookmarks/api/form?gameId=4");
      const data = await response.json();
      
      if (data.scores) {
        setTopScores(data.scores.map((score: any) => ({
          score: score.score,
          time: score.createdAt,
          name: score.username
        })));
      }
    } catch (error) {
      console.error("Error loading scores:", error);
    }
  }, []);

  const saveScore = async () => {
    if (scoreSaved) return;
    







    try {
      const response = await fetch("/bookmarks/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          gameId: 4,
          username: "player",
          score: score,
          gameConfig: {}
        }),
      });





      if (response.ok) {
        setScoreSaved(true);
        await loadScores();
      }
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };





  const finishGame = useCallback(() => {
    setPlaying(false);
    saveScore();
  }, [saveScore]);


  useEffect(() => {
    if (playing) {
      setTime(40);
      setScore(0);
      setScoreSaved(false);
    }









    



















    const interval = playing ? setInterval(() => {
      setTime(time => {
        if (time > 0) {
          return time - 1;
        } else {
          finishGame();
          return 0;
        }













      });
    }, 1000) : null;

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [playing, finishGame]);

  useEffect(() => {
    requestWord();
  }, [requestWord]);

  useEffect(() => {
    const audio = document.getElementsByTagName("audio")[0] as HTMLAudioElement;
    if (playing && word && audio) {
      audio.play().catch(() => {});
    }
  }, [word, playing]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 120px)",
        width: "100%",
        color: "white",
        textAlign: "center",
        padding: "16px"
      }}
    >
      <MainMenu />
      
      {!showScores && (
        <>
          <Button 
            sx={{ mb: 2, background: "#666" }}
            variant="contained" 
            onClick={() => setShowScores(true)}
          >
            Scores
          </Button>

          <InputLabel 
            sx={{ 
              lineHeight: "54px", 
              height: "54px", 
              fontSize: "24px",
              color: "white",
              marginBottom: "16px"
            }}
          >
            {!playing ? "Let's play!" : showWord ? word : "Hidden"}
          </InputLabel>
          
          <TextField 
            color={word === text ? "primary" : "error"}
            onKeyDown={(event) => {
              if (event.key === "Enter" && text === word && playing) {
                requestWord();
                setText("");
                setScore(s => s + 1);
              }
            }}
            sx={{
              background: "white",
              height: "54px",
              borderRadius: "4px",
              "& .MuiInputBase-root": {
                height: "54px"
              }
            }}
            value={text}
            onChange={(e: any) => setText(e.target.value)}
            disabled={!playing}
          />
          
          <br />
          
          <Box sx={{ display: "flex", gap: "8px", mt: 2 }}>
            <Button 
              sx={{ height: "54px", background: "#666", minWidth: "100px" }}
              variant="contained" 
              onClick={() => {
                setPlaying(!playing);
                if (!playing) {
                  setTime(40);
                  setScore(0);
                  setScoreSaved(false);
                  requestWord();
                }
              }}
            >
              {playing ? "STOP" : "PLAY"}
            </Button>
            
            <Button
              sx={{ height: "54px", background: "#666", minWidth: "100px" }}
              variant="contained" 
              onClick={() => setShowWord(!showWord)}
              disabled={!playing}
            >
              {!showWord ? "SHOW" : "HIDE"}
            </Button>
            
            <Button
              sx={{ height: "54px", background: "#666", minWidth: "100px" }}
              variant="contained" 
              onClick={() => {
                if (text === word && playing) {
                  requestWord();
                  setText("");
                  setScore(s => s + 1);
                }
              }}
              disabled={!playing}
            >
              Check
            </Button>
          </Box>

          <Typography 
            variant="h6" 
            sx={{ 
              mt: 2, 
              color: time <= 10 ? "#ff4444" : "white"
            }}
          >
            {score + " correct words, remaining " + time + "s"}
          </Typography>
          
          {!playing && score > 0 && (
            <Typography variant="h5" sx={{ mt: 2, color: "#4CAF50" }}>
              Game Over! Score: {score}
            </Typography>
          )}
          
          <br />
          
          {word !== "" && playing && (
            <Box sx={{ mt: 2 }}>
              <audio key={word} style={{ display: "none" }} controls autoPlay>
                <source 
                  src={"/bookmarks/api/audio?file=" + word + ".mp3"}
                  type="audio/mpeg"
                />
              </audio>
            </Box>
          )}
        </>
      )}

      {showScores && (
        <Box sx={{ width: "100%", maxWidth: "500px" }}>
          <Button 
            variant="contained" 
            onClick={() => setShowScores(false)}
            sx={{ mb: 2, background: "#666" }}
          >
            Play
          </Button>
          
          <Typography variant="h5" sx={{ mb: 2 }}>
            Highest scores
          </Typography>
          
          {topScores.length > 0 && (
            <Table sx={{ border: 1, borderColor: "white" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "white", borderColor: "white", fontWeight: "bold" }}>Pos</TableCell>
                  <TableCell sx={{ color: "white", borderColor: "white", fontWeight: "bold" }}>User</TableCell>
                  <TableCell sx={{ color: "white", borderColor: "white", fontWeight: "bold" }}>Score</TableCell>
                  <TableCell sx={{ color: "white", borderColor: "white", fontWeight: "bold" }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topScores
                  .sort((a: any, b: any) => b.score - a.score)
                  .slice(0, 10)
                  .map((a: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell sx={{ color: "white", borderColor: "white", padding: "6px" }}>
                        {i + 1}
                      </TableCell>
                      <TableCell sx={{ color: "white", borderColor: "white", padding: "6px" }}>
                        {a.name}
                      </TableCell>
                      <TableCell sx={{ color: "white", borderColor: "white", padding: "6px" }}>
                        {a.score}
                      </TableCell>
                      <TableCell sx={{ color: "white", borderColor: "white", padding: "6px" }}>
                        {new Date(a.time).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}

          {topScores.length === 0 && (
            <Typography sx={{ color: "#999" }}>
              No scores yet. Play and be the first!
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Wording;