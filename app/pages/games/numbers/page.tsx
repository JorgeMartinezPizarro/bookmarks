'use client'

import { Box, Button } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import "./styles.module.css"
import { CellProps, CellValues } from "./types";
import { randomArrayCellValues } from "./helpers";
import MainMenu from "@/app/components/MainMenu";
import { errorMessage } from "@/app/helpers";

const GamesComponent = () => {
  const [start, setStart] = useState(Date.now())
  const [scores, setScores] = useState(true)  
  const [loading, setLoading] = useState(false)
  const [isRight, setIsRight] = useState(true)
  const [last, setLast] = useState<CellValues|undefined>(undefined)
  const [numbers, setNumbers] = useState<CellValues[]>([])
  const [score, setScore] = useState<number>(0)
  const [time, setTime] = useState<number>(Date.now())
  const [topScores, setTopScores] = useState<any>([])
  const [error, setError] = useState(undefined)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  const currentScore = time - start === 0 ?
    0 : 
    Math.round(score**3 * 1000 / (time - start))

  useEffect(() => {
    setMounted(true)
  }, [])

  const Cell = (props: CellProps) => {
    const isCrossed = props?.values.b
    
    return props !== undefined && 
      <Button 
        className={!isRight ? " danger" : ""}
        color={isCrossed ? "secondary" : "primary"}
        disabled={loading || !isRight || props.values.b}
        onClick={() => props.handleClick(props)}
      >
        {props.values.n}
      </Button>
  }

  const Square = (props: CellProps) => {
    return <Box key={props.values.i} className="cell">
      {props && <Cell {...props} />}
    </Box>
  }

  const saveScore = async () => {
    if (scoreSaved) return;
    
    try {
      const response = await fetch("/bookmarks/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          gameId: 2,
          username: "player",
          score: currentScore,
          gameConfig: { steps: score }
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

  const loadScores = useCallback(async () => {
    setError(undefined);
    try {
      const response = await fetch("/bookmarks/api/form?gameId=2");
      const data = await response.json();
      
      if (data.scores) {
        setTopScores(data.scores.map((score: any) => ({
          score: score.score,
          steps: score.gameConfig?.steps || 0,
          name: score.username,
          time: score.createdAt
        })));
      }
    } catch (e: any) {
      setError(e.message || "Error loading scores");
    }
  }, []);

  const handleClick = useCallback((cell: CellValues): boolean => {
    const clickIsRight = !cell.values.b && isRight && (
        last === undefined ||
        (20 + last.values.i - cell.values.i) % 20 === last.values.n || 
        (20 - last.values.i + cell.values.i) % 20 === last.values.n
    )
    
    if (!clickIsRight) {
      saveScore();
      setIsRight(false);
      setLast(undefined);
      return true;
    }
    
    const newNumbers = [...numbers].map(r => {
      return r.values.i !== cell.values.i
        ? {...r}
        : {
          values: {
            ...r.values,
            b: true,
          }
        }
    })

    if (last === undefined)
      setStart(Date.now())
    setTime(Date.now())
    setNumbers(newNumbers)
    setScore(score+1)
    setLast({...cell})

    return false
  }, [last, score, numbers, setIsRight, setNumbers, setLast, setScore, currentScore, isRight, saveScore])

  const newNumbers = [...numbers]
  const [top, right, bottom, left] = [
    newNumbers.slice(0, 6),
    newNumbers.slice(6, 10),
    newNumbers.slice(10, 16).reverse(),
    newNumbers.slice(16, 20).reverse()
  ]

  const newGame = useCallback(() => {
    setLoading(true)
    setIsRight(true)
    setLast(undefined)
    setNumbers(randomArrayCellValues(20))
    setScore(0)
    setScoreSaved(false)
    setTimeout(() => {
      setStart(Date.now())
      setLoading(false)
      setTime(Date.now())
    }, 150)
  }, [setIsRight, setLast, setNumbers, setScore])

  useEffect(() => {
    loadScores()
    const startGameSoon = setTimeout(() => newGame(), 25)
    return () => {
      clearTimeout(startGameSoon)
    }
  }, [loadScores, newGame])

  // No renderizar nada hasta que el componente esté montado en el cliente
  if (!mounted) {
    return (
      <>
        <MainMenu />
        <Box sx={{ color: "white", textAlign: "center", mt: 4 }}>
          <h4>Loading Numbers Game...</h4>
        </Box>
      </>
    )
  }

  // Función para determinar el texto del botón central
  const getCenterButtonText = (rowIndex: number, colIndex: number) => {
    if (score === 0 && rowIndex === 1 && colIndex === 1) return "Let's"
    if (score === 0 && rowIndex === 1 && colIndex === 2) return "Play"
    if (!isRight && rowIndex === 1 && colIndex === 1) return "GAME"
    if (!isRight && rowIndex === 1 && colIndex === 2) return "OVER"
    return ""
  }

  return (
    <>
      <MainMenu />
      <Button className="game-menu" variant="contained" onClick={() => setScores(!scores)}>
        {!scores ? "Play" : "Scores"}
      </Button>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 140px)",
          textAlign: "center",
          width: "100%",
          padding: "8px"
        }}
      >
        {error && <pre style={{color: "red"}}>{errorMessage(error)}</pre>}
        
        {scores && numbers.length === 20 && (
          <Box className={"box" + (loading ? " loading" : "")}>
            {/* Controls line */}
            <Box>
              <Button className={isRight ? undefined : "danger"} onClick={newGame}>Reset</Button>
              <Button disabled>Score</Button>
              <Button disabled>{currentScore}</Button>
              <Button disabled>Steps</Button>
              <Button disabled>{score}</Button>
              {isRight ? (
                <Button disabled>{}</Button>
              ) : (
                <Button disabled className="danger">💀</Button>
              )}
            </Box>
            
            {/* First row */}
            {top.map(number => (
              <Square key={number.values.i + "-top"} values={number.values} handleClick={handleClick} />
            ))}
            
            {/* Middle rows */}
            {Array.from({ length: 4 }).map((_, rowIndex) => (
              <React.Fragment key={`row-${rowIndex}`}>
                <Square values={left[rowIndex].values} handleClick={handleClick} />
                {Array.from({ length: 4 }).map((_, colIndex) => (
                  <Box key={`empty-${rowIndex}-${colIndex}`}>
                    <Button disabled className={isRight ? undefined : "danger"}>
                      {getCenterButtonText(rowIndex, colIndex)}
                    </Button>
                  </Box>
                ))}
                <Square values={right[rowIndex].values} handleClick={handleClick} />
              </React.Fragment>
            ))}
            
            {/* Bottom rows */}
            {bottom.map(number => (
              <Square key={number.values.i + "-bot"} values={number.values} handleClick={handleClick} />
            ))}
          </Box>
        )}

        {!scores && topScores.length > 0 && (
          <>
            <h4>Highest scores</h4>
            <table style={{width: "70%", maxWidth: "400px", margin: "auto"}} border={2}>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>User</th>
                  <th>Score</th>
                  <th>Steps</th>
                </tr>
              </thead>
              <tbody>
                {topScores
                  .sort((a: any, b: any) => b.score - a.score)
                  .slice(0, 10)
                  .map((a: any, i: number) => (
                    <tr key={i}>
                      <td style={{padding: "6px"}}>{i+1}</td>
                      <td style={{padding: "6px"}}>{a.name}</td>
                      <td style={{padding: "6px"}}>{a.score}</td>
                      <td style={{padding: "6px"}}>{a.steps}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            <h4>Longer games</h4>
            <table style={{marginBottom: "24px", width: "70%", maxWidth: "400px", margin: "auto"}} border={2}>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>User</th>
                  <th>Score</th>
                  <th>Steps</th>
                </tr>
              </thead>
              <tbody>
                {topScores
                  .sort((a: any, b: any) => b.steps - a.steps)
                  .slice(0, 10)
                  .map((a: any, i: number) => (
                    <tr key={i}>
                      <td style={{padding: "6px"}}>{i+1}</td>
                      <td style={{padding: "6px"}}>{a.name}</td>
                      <td style={{padding: "6px"}}>{a.score}</td>
                      <td style={{padding: "6px"}}>{a.steps}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </>
        )}
      </Box>
    </>
  );
}

export default GamesComponent