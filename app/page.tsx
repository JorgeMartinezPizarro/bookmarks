'use client';

import { Box, Button } from "@mui/material";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";

const key = "123213231asdssdadasdas213"
const AgePage = () => {
    const [birthDate, setBirthDate] = useState("")
    const [days, setDays] = useState(0)
    const [user, setUser] = useState("")
    
    useEffect(() => {
        if (localStorage)
            setBirthDate(localStorage.getItem(key)||"")
    }, [])
    useEffect(() => {
        if (birthDate !== "") 
            localStorage.setItem(key, birthDate)
        try {
            const a = new Date()
            const b = new Date(
                birthDate.substring(6, 10) + "-" +
                birthDate.substring(3, 5) + "-" +
                birthDate.substring(0, 2) +
                "T00:00:00"
            )
            setDays(Math.round((a.getTime() - b.getTime()) / 86400000))
            
        } catch (e) {

        }
    }, [birthDate])
    
   const size = 64;
   return <Box className="intro" style={{ height: '100vh'}} display="flex" flexDirection="column" alignItems="center" gap={2}>
        <p>Enter your birthdate as <i>dd-mm-yyyy</i></p>
        <input type="text" value={birthDate} onChange={(e: any) => {setBirthDate(e.target.value)}} />
        <p>Dear user, you are since {days} days on planet Earth, congratulations!</p>
    </Box>
}

export default AgePage;