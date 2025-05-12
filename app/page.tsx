'use client';

import { Box, TextField, Button, Menu, MenuItem } from "@mui/material";
import { MouseEvent, useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import MainMenu from "./components/MainMenu";
import { useSession } from "next-auth/react";
import Image from "next/image";

const key = "123213231asdssdadasdas213"
// TODO: add user scores
const AgePage = () => {
    const [birthDate, setBirthDate] = useState("")
    const [days, setDays] = useState(0)
    const [user, setUser] = useState("")
    const [page, setPage] = useState("")

    const {data: session, status} = useSession()
    

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

   const box = <Box className="intro" style={{ justifyContent: "center", height: '100vh'}} display="flex" flexDirection="column" alignItems="center" gap={2}>
    <p>Enter your birthdate as <i>dd-mm-yyyy</i></p>
    <TextField style={{background: "white", color: "black"}} value={birthDate} onChange={(e: any) => {setBirthDate(e.target.value)}} />
    <p>Dear <i>{session?.user?.name || "user"}</i>, you are since {days} days on planet Earth, congratulations!</p>
    <p><Button title="Chess" onClick={()=>window.location.href="/bookmarks/pages/games/chess"}>
          <Image alt="" width="64" height="64" src="/bookmarks/queen.png" />
        </Button>
        <Button title="Words" onClick={()=>window.location.href="/bookmarks/pages/games/words"}>
          <Image alt="" width="64" height="64" src="/bookmarks/omega.png" />
        </Button>
        <Button title="Numbers" onClick={()=>window.location.href="/bookmarks/pages/games/numbers"}>
          <Image alt="" width="64" height="64" src="/bookmarks/number.png" />
        </Button>
        <Button title="Tetris" onClick={()=>window.location.href="/bookmarks/pages/games/tetris"}>
          <Image alt="" width="64" height="64" src="/bookmarks/tetris.png" />
        </Button></p>
   
   </Box>
   return <>
        <MainMenu />
      {box}
    
   </>
}

export default AgePage;