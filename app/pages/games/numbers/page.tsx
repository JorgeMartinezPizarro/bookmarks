'use client'

import { Box, Button } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import "./styles.css"
import { CellProps, CellValues } from "./types";
import { randomArrayCellValues } from "./helpers";

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
  
  const currentScore = time - start === 0 ?
    0 : 
    Math.round(score ** 2 * 1500 / (time - start))

  const Cell = (props: CellProps) => {
    
    const isCrossed = props?.values.b
    
    return props !== undefined && 
      <Button 
        className={!isRight ? " danger" : ""}
        color={isCrossed ? "secondary" : "primary"}
        disabled={loading || !isRight || props.values.b}

        onClick={() => props.handleClick(props)}>{props.values.n}
    </Button>
  }

  const Square = (props: CellProps) => {
      return <Box
          key={props.values.i}
          className="cell"
      >
          {props && <Cell {...props} />}
      </Box>
  }

  const handleClick = useCallback((cell: CellValues): void => {
    
    const clickIsRight = !cell.values.b && isRight && (
        last === undefined ||
        (20 + last.values.i - cell.values.i) % 20 === last.values.n || 
        (20 - last.values.i + cell.values.i) % 20 === last.values.n
    )
    
    if (!clickIsRight) {
      fetch("/bookmarks/api/form", {
        method: "POST",
        body: JSON.stringify({ 
          form: 1, // form to save the progress
          score: currentScore,
          steps: score,
        }),
      }).then(a => a.json()).then(a => loadScores())
      setIsRight(false)
      setLast(undefined)
      return
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
    
  }, [last, score, numbers, setIsRight, setNumbers, setLast, setScore])

  const newNumbers = [...numbers]
  const [top, right, bottom, left] = [
    newNumbers.slice(0, 6),
    newNumbers.slice(6, 10),
    newNumbers.slice(10, 16).reverse(),
    newNumbers.slice(16, 20).reverse()
  ]

  const loadScores = useCallback(() => {
    fetch("/bookmarks/api/form?formId=1").then(a => a.json()).then(a => {
      const topScores = a.ocs.data.submissions.map((e: any) => {
        return {
          score: e.answers[0].text,
          steps: e.answers[1].text,
          name: e.answers[2].text
        }
      })
      setTopScores(topScores)
    })
  }, [setTopScores])
  const newGame = useCallback(() => {
    setLoading(true)
    setIsRight(true)
    setLast(undefined)
    setNumbers(randomArrayCellValues(20))
    setScore(0)
    setTimeout(() => {
      setStart(Date.now())
      setLoading(false)
      setTime(Date.now())
    }, 150)
  }, [setIsRight, setLast, setNumbers, setScore])

  useEffect(() => {
    // Start load game on component mount
    

    loadScores()
    const startGameSoon = setTimeout(() => newGame(), 25)
    return () => {
      // Clear load action on component unmount
      clearTimeout(startGameSoon)
    }
  }, [])

  

  return (<>
  <Button variant="contained" onClick={() => setScores(!scores)}>{!scores ? "Play" : "Scores"}</Button>
  <Box
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      textAlign: "center",
    }}
  >
    {scores && <>
    {/* Render The Game Board */}
    {numbers.length === 20 && <Box
      className={"box" + (loading ? " loading" : "")}
    > 
      {/* Controls line */}
      <Box><Button className={isRight ? undefined : "danger"} onClick={newGame}>Reset</Button></Box>
      <Box><Button className={isRight ? undefined : "danger"} disabled>Score</Button></Box>
      <Box><Button className={isRight ? undefined : "danger"} disabled>{currentScore}</Button></Box>
      <Box><Button className={isRight ? undefined : "danger"} disabled></Button></Box>
      <Box><Button className={isRight ? undefined : "danger"} disabled></Button></Box>
      <Box>{isRight ?
          <Button disabled>{}</Button> :
          <Button disabled className="danger">💀</Button>          
      }</Box>
      {/* First row */}
      {top.map(number => <Square key={number.values.i + "-top"} values={number.values} handleClick={handleClick} />)}
      {/* Middle rows */}
      {Array.from({ length: 4 }).map((_, rowIndex) => (
        <React.Fragment key={`row-${rowIndex}`}>
            <Square values={left[rowIndex].values} handleClick={handleClick} />
            {Array.from({ length: 4 }).map((_, colIndex) => (
              <Box key={`empty-${rowIndex}-${colIndex}`} >
                <Button disabled className={isRight ? undefined : "danger"}>{
                  score === 0 && rowIndex === 1 && colIndex === 1 && "Lets" ||
                  score === 0 && rowIndex === 1 && colIndex === 2 && "Play" ||
                  !isRight && rowIndex === 1 && colIndex === 1 && "GAME" ||
                  !isRight && rowIndex === 1 && colIndex === 2 && "OVER"
                }</Button>
              </Box>
            ))}
            <Square values={right[rowIndex].values} handleClick={handleClick} />
        </React.Fragment>
      ))}
      {/* Bottom rows */}
      {bottom.map(number => <Square key={number.values.i + "-bot"} values={number.values} handleClick={handleClick} />)}
    </Box>}
    </>}
    {!scores && topScores && <h4>Highest scores</h4>}
    {!scores && topScores && <table style={{width: "70%" }} border={2}>
      <tr><th>Pos</th><th>User</th><th>Score</th><th>Steps</th></tr>
      {topScores
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10)
        .map((a: any, i: number) => <tr style={{padding: ""}}>
          <td style={{padding: "6px"}}>{i+1}</td>
          <td style={{padding: "6px"}}>{a.name}</td>
          <td  style={{padding: "6px"}}>{a.score}</td>
          <td  style={{padding: "6px"}}>{a.steps}</td>
        </tr>)
      }
    </table>}
    {!scores && topScores && <h4>Longer games</h4>}
    {!scores && topScores && <table style={{marginBottom: "24px", width: "70%" }} border={2}>
      <tr><th>Pos</th><th>User</th><th>Score</th><th>Steps</th></tr>
      {topScores
        .sort((a: any, b: any) => b.steps - a.steps)
        .slice(0, 10)
        .map((a: any, i: number) => <tr style={{padding: ""}}>
          <td style={{padding: "6px"}}>{i+1}</td>
          <td style={{padding: "6px"}}>{a.name}</td>
          <td  style={{padding: "6px"}}>{a.score}</td>
          <td  style={{padding: "6px"}}>{a.steps}</td>
        </tr>)
      }
    </table>}
  </Box></>);
}

export default GamesComponent