'use client';

import { TextField, Button, InputLabel } from "@mui/material";
import { useCallback, useEffect, useState } from "react";

const Wording = () => {
  const [word, setWord] = useState("")

  const [text, setText] = useState("")
  const requestWord = useCallback(() => {
    // TODO Use node api to generate the word
    fetch("/word")
      .then(a => a.json())
      .then(a => setWord(a.word))
  
  }, [setWord])

  useEffect(requestWord, [requestWord])
  return <div style={{margin: "auto", width: "320px", color: "white", textAlign: "center", marginTop: "100px"}}>
    <InputLabel>{word}</InputLabel>
    <hr />
    <TextField style={{background: "white"}} value={text} onChange={(e: any) => setText(e.target.value)} />
    <hr />
    <div>
      {word !== "" && <audio key={word} controls>
        <source 
          src={"/bookmarks/api/audio?file="+word+".mp3"}
          type="audio/mpeg"
        ></source>
      </audio>}
    </div>
    <hr />
    <Button 
      variant="contained" 
      color="secondary" 
      style={{height: "54px", background: "grey", padding: "8px", borderRadius: "4px"}} 
      onClick={requestWord}
    >Request word</Button>
  </div>
}

export default Wording;