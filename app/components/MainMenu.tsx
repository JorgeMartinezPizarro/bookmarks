'use client'

import { Button, Menu, MenuItem } from "@mui/material";
import { MouseEvent, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import MenuOpenIcon from "@mui/icons-material/Menu";
import Image from "next/image";


const MainMenu = () => {
  const {status } = useSession()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const open = Boolean(anchorEl);
        const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
            setAnchorEl(event.currentTarget);
        };
        const handleClose = () => {
            setAnchorEl(null);
        };

    return <>
        <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        style={{
          color: "grey",
          position: "absolute",
          left: "5px",
          top: "58px",
          zIndex: "14000",
          padding: "8px",
          minWidth: "0",
          margin: 0,
          scale: "1.4"
        }}
      >
        <MenuOpenIcon />
      </Button>
    <Menu
        id="basic-menu"
        color="secondary"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem  color="primary" onClick={()=>window.location.href="/bookmarks"}><Button>
          <Image alt="" width="24" height="24" src="/bookmarks/icon-test.png" />Home
        </Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/code"}><Button>
          <Image alt="" width="24" height="24" src="/bookmarks/icon-github.png" />Code
        </Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/trainer"}><Button>
          <Image alt="" width="24" height="24" src="/bookmarks/espada.png" />Trainer
        </Button></MenuItem>
        <hr />
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/games/chess"}><Button>
          <Image alt="" width="24" height="24" src="/bookmarks/queen.png" />Chess
        </Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/games/words"}><Button>
          <Image alt="" width="24" height="24" src="/bookmarks/omega.png" />Words
        </Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/games/numbers"}><Button>
          <Image alt="" width="24" height="24" src="/bookmarks/number.png" />Numbers
        </Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/games/tetris"}><Button>
          <Image alt="" width="24" height="24" src="/bookmarks/tetris.png" />Tetris
        </Button></MenuItem>
		<MenuItem onClick={()=>window.location.href="/bookmarks/pages/monitor"}><Button>
          <Image alt="" width="24" height="24" src="/bookmarks/icon-math.png" />System
        </Button></MenuItem>
        <hr />
        {<MenuItem onClick={() => {
				  signIn("nextcloud", {callbackUrl: window.location.href, redirect: true})
			  }}><Button 
          color="primary"
          
        >
          <Image alt="" width="24" height="24" src="/bookmarks/user.png" />Login
        </Button></MenuItem>}
      </Menu>
    </>
}

export default MainMenu;