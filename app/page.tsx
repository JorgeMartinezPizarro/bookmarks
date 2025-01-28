'use client';

import { Box, Button } from "@mui/material";
import { useEffect, useState } from "react";

const key = "123213231asdssdadasdas213"
const AgePage = () => {
    const [birthDate, setBirthDate] = useState(localStorage.getItem(key) || "")
    const [days, setDays] = useState(0)
    const [user, setUser] = useState("")
    
    useEffect(() => {
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
    /*useEffect(() => {
        fetch('/ocs/v2.php/cloud/user?format=json', {
    method: 'GET',
    headers: {
        'OCS-APIRequest': 'true' // Importante para las APIs OCS
    },
    credentials: 'include' // Esto asegura que las cookies se envíen automáticamente
    })
    .then(response => response.json())
    .then(data => {
        const username = data.ocs?.data?.id;
        setUser(username)
    })
    .catch(error => console.error('Error al obtener el usuario:', error));

    }, [])
    */
   const size = 64;
   return <Box className="intro" style={{ height: '100vh'}} display="flex" flexDirection="column" alignItems="center" gap={2}>
        <p>Input your birthdate as <i>dd-mm-yyyy</i></p>
        <input type="text" value={birthDate} onChange={(e: any) => {setBirthDate(e.target.value)}} />
        <p>Dear user, you are since {days} days on planet Earth, congratulations!</p>
        <p>What do you want to play today?</p>
        <p>
            <Button onClick={(e: any) => {window.parent.location.href = "https://nube.ideniox.com/apps/external/11/"}} >
                <img src="/bookmarks/tetromino_tetris.png" width={size} height={size} />
            </Button>
            &nbsp;/&nbsp; 
            <Button onClick={(e: any) => {window.parent.location.href = "https://nube.ideniox.com/apps/external/9/"}} >
                <img src="/bookmarks/queen.png" width={size} height={size} />
            </Button>
            &nbsp;/&nbsp;
            <Button onClick={(e: any) => {window.parent.location.href = "https://nube.ideniox.com/apps/external/1/"}} >
                <img src="/bookmarks/icon-test.png" width={size} height={size} />
            </Button>
            &nbsp;/&nbsp; 
            <Button onClick={(e: any) => {window.parent.location.href = "https://nube.ideniox.com/apps/external/12/"}} >
                <img src="/bookmarks/omega_lowercase_transparent_fixed.png" width={size} height={size} />    
            </Button>
          </p>
          <p>Or maybe you prefer to learn a bit?</p>
          
            <p>
            <Button onClick={(e: any) => {window.parent.location.href = "https://nube.ideniox.com/apps/external/7/"}} >
                <img src="/bookmarks/favicon.ico" width={size} height={size} />    
            </Button>
            <Button onClick={(e: any) => {window.parent.location.href = "https://nube.ideniox.com/apps/external/4/"}} >
                <img src="/bookmarks/espada.png" width={size} height={size} />    
            </Button>
            </p>
          
    </Box>
}

export default AgePage;