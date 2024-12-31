'use client'

import { errorMessage } from '@/app/helpers';
import React, { useState, useEffect, useCallback } from 'react';

const TrainerComponent = () => {
  
	const [question, setQuestion] = useState<string>("")
    const [answer, setAnswer]     = useState<string>("")

    const handleChange = (event: any) => {
        setQuestion(event.target.value);
    };

    const handleSubmit = (event: any) => {
        fetch(`/home/api/ask?question=${question}`)
            .then(res=>res.text())
            .then(res=>setAnswer(res))
            .catch(error => setAnswer(errorMessage(error)))
    }

    useEffect(() => {
        
    }, [])
    
  return <>
	    <textarea 
            style={{width: "100%", height:"300px"}}
            value={question}
            onChange={handleChange}
            placeholder='Hola, en que puedo ayudarte?'
        />
        <hr/>
        <button onClick={handleSubmit}>Submit the question</button>
        <hr/>
        <p>{answer}</p>
        <hr/>
        <div>HINT: Reading the question before send it is highly recommended.</div>
  </>  
}

export default TrainerComponent;
