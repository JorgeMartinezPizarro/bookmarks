'use client'

import { Box, Button } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import "./styles.css"
import { CellProps, CellValues } from "./types";
import { randomArrayCellValues } from "./helpers";

const GamesComponent = () => {

  const [start, setStart] = useState(Date.now())
    
  const [loading, setLoading] = useState(false)
  const [isRight, setIsRight] = useState(true)
  const [last, setLast] = useState<CellValues|undefined>(undefined)
  const [numbers, setNumbers] = useState<CellValues[]>([])
  const [score, setScore] = useState<number>(0)
  const [time, setTime] = useState<number>(Date.now())
  
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
    const startGameSoon = setTimeout(() => newGame(), 25)
    return () => {
      // Clear load action on component unmount
      clearTimeout(startGameSoon)
    }
  }, [])

  const currentScore = time - start === 0 ?
    0 : 
    Math.round(score ** 2 * 1500 / (time - start))

  console.log(Math.log(time - start) / 10)
  return (<Box
    sx={{
      display: "flex", // Activar Flexbox
      justifyContent: "center", // Centrado horizontal
      alignItems: "center", // Centrado vertical
      height: "100vh", // Altura completa del contenedor
      width: "100%", // Ancho completo del contenedor
      margin: "0",
      padding: "0"
    }}
  >
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
  </Box>);
}

export default GamesComponent