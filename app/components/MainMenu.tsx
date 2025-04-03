'use client'

import { Button, Menu, MenuItem } from "@mui/material";
import { MouseEvent, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import MenuOpenIcon from "@mui/icons-material/Menu";


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
        variant="contained"
        style={{
          position: "absolute",
          right: "8px",
          top: "54px",
        }}
      >
        <MenuOpenIcon />
      </Button>
    <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={()=>window.location.href="/bookmarks"}><Button>Home</Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/code"}><Button>Code</Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/monitor"}><Button>Monitor</Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/trainer"}><Button>Trainer</Button></MenuItem>
        <hr />
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/games/chess"}><Button>Chess</Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/games/words"}><Button>Words</Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/games/numbers"}><Button>Numbers</Button></MenuItem>
        <MenuItem onClick={()=>window.location.href="/bookmarks/pages/games/tetris"}><Button>Tetris</Button></MenuItem>
        {<MenuItem onClick={() => {
				  signIn("nextcloud", {callbackUrl: window.location.href, redirect: true})
			  }}><Button 
			color="primary"
			variant="contained"
		>
			Login
		</Button></MenuItem>}
      </Menu>
    </>
}

export default MainMenu;