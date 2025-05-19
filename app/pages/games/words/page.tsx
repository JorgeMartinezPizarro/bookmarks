'use client';

import MainMenu from "@/app/components/MainMenu";
import { TextField, Button, InputLabel } from "@mui/material";
import { useCallback, useEffect, useState } from "react";


// TODO: fix buttons menu.
const Wording = () => {
  const [word, setWord] = useState("")
  const [score, setScore] = useState(0)
  const [text, setText] = useState("")
  const [showWord, setShowWord] = useState(true)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  const requestWord = useCallback(() => {
    // TODO Use node api to generate the word
    if (playing) fetch("/word")
      .then(a => a.json())
      .then(a => setWord(a.word))
    else {
      setWord("")
    }
  }, [setWord, playing])

  useEffect(() => {
    const audio = document.getElementsByTagName("audio")[0] as HTMLAudioElement
    if (playing) audio?.play()
  }, [word, playing])
  useEffect(() => {
    if (playing) {
      setTime(60)
      setScore(0)
    }
    
    const i = playing && setInterval(() => {
        setTime(time => {
          if (time !== 0)
            return time-1
          setPlaying(false)
          
          clearInterval(this)

          return time
        })
      
    }, 1000)

    return () => {
      if (i) {
        clearInterval(i)
       } else {

       }
    }
  }, [playing, setTime, setScore])
  useEffect(requestWord, [requestWord])
  return <div style={{display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height:"100%", verticalAlign: "middle", margin: "auto", width: "320px", color: "white", textAlign: "center"}}>
    <MainMenu />
    <InputLabel style={{lineHeight: "54px", height: "54px"}}>{!playing ? "Lets play!" : showWord ? word : "Hidden"}</InputLabel>
    
    <TextField color={word===text ? "primary" : "error"} onKeyDown={(event) => {if (event.key === "Enter" && text === word) {
          requestWord()
          setText("")
          setScore(score => score+1)
    }}} style={{background: "white", height: "54px"}} value={text} onChange={(e: any) => setText(e.target.value)} />
    <br />
    <div><Button 
      style={{margin: "0 8px", height: "54px", background: "grey", padding: "8px", borderRadius: "4px"}}  
      variant="contained" onClick={event=>setPlaying(!playing)}>{playing ? "STOP" : "PLAY"}</Button>
      <Button
        style={{margin: "0 8px", height: "54px", background: "grey", padding: "8px", borderRadius: "4px"}}  
        variant="contained" onClick={() => setShowWord(!showWord)}>{!showWord ? "SHOW" : "HIDE"}</Button>
    <Button
      style={{margin: "0 8px", height: "54px", background: "grey", padding: "8px", borderRadius: "4px"}} 
      variant="contained" type="submit" onClick={() => {
        if (text === word) {
          requestWord()
          setText("")
          setScore(score => score+1)
        }
      }}>Check</Button>
    </div>
    <p>{score + " correct words, remaining " + time + "s"}</p>
    <br />
    
      {word !== "" && <div><audio key={word} style={{display: "none"}} controls>
        <source 
          src={"/bookmarks/api/audio?file="+word+".mp3"}
          type="audio/mpeg"
        ></source>
      </audio></div>}
  </div>
}

export default Wording;