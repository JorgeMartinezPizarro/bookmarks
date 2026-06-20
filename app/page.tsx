'use client';

import { Box, TextField, Button } from "@mui/material";
import { useEffect, useState } from "react";
import MainMenu from "./components/MainMenu";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";

const key = "123213231asdssdadasdas213";

const AgePage = () => {
  const [birthDate, setBirthDate] = useState("");
  const [days, setDays] = useState(0);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBirthDate(localStorage.getItem(key) || "");
    }
  }, []);

  useEffect(() => {
    if (birthDate !== "") {
      localStorage.setItem(key, birthDate);
    }

    try {
      const a = new Date();
      const b = new Date(
        birthDate.substring(6, 10) + "-" +
        birthDate.substring(3, 5) + "-" +
        birthDate.substring(0, 2) +
        "T00:00:00"
      );

      setDays(Math.round((a.getTime() - b.getTime()) / 86400000));
    } catch {}
  }, [birthDate]);

  if (status === "loading") {
    return (
      <>
        <MainMenu />
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <p>Loading session...</p>
        </Box>
      </>
    );
  }

  if (status === "unauthenticated") {
    return (
      <>
        <MainMenu />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: 2,
          }}
        >
          <p>You are not signed in</p>
          <Button variant="contained" onClick={() => signIn()}>
            Sign in
          </Button>
        </Box>
      </>
    );
  }

  return (
    <>
      <MainMenu />
      <Box
        className="intro"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <p>Enter your birthdate as <i>dd-mm-yyyy</i></p>

        <TextField
          style={{ background: "white", color: "black" }}
          value={birthDate}
          onChange={(e: any) => setBirthDate(e.target.value)}
        />

        <p>
          Dear <i>{session?.user?.name || "user"}</i>, you are since {days} days on planet Earth, congratulations!
        </p>

        <p>
          <Button title="Chess" onClick={() => window.location.href = "/bookmarks/pages/games/chess"}>
            <Image alt="" width={64} height={64} src="/bookmarks/queen.png" />
          </Button>

          <Button title="Words" onClick={() => window.location.href = "/bookmarks/pages/games/words"}>
            <Image alt="" width={64} height={64} src="/bookmarks/omega.png" />
          </Button>

          <Button title="Numbers" onClick={() => window.location.href = "/bookmarks/pages/games/numbers"}>
            <Image alt="" width={64} height={64} src="/bookmarks/number.png" />
          </Button>

          <Button title="Tetris" onClick={() => window.location.href = "/bookmarks/pages/games/tetris"}>
            <Image alt="" width={64} height={64} src="/bookmarks/tetris.png" />
          </Button>
        </p>
      </Box>
    </>
  );
};

export default AgePage;