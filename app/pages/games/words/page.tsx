'use client';

import { useCallback, useEffect, useState } from "react";

const Wording = () => {
  const [word, setWord] = useState("")

  const requestWord = useCallback(() => {
    fetch("https://nube.ideniox.com/word")
      .then(a => a.json())
      .then(a => setWord(a.word))
  
  }, [setWord])

  useEffect(requestWord, [])
  return <div style={{textAlign: "center", marginTop: "100px"}}>
    <div>{word}</div>
    <div>
      {word !== "" && <audio key={word} controls>
        <source 
          src={"https://nube.ideniox.com/bookmarks/api/audio?file="+word+".mp3"}
          type="audio/mpeg"
        ></source>
      </audio>}
    </div>
    <button style={{background: "grey", padding: "8px", borderRadius: "4px"}} onClick={requestWord}>Refresh</button>
  </div>
}

export default Wording;