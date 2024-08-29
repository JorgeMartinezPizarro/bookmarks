'use client'

import { AppBar, Button, Toolbar, CircularProgress } from '@mui/material';

import LibraryMusicIcon from '@mui/icons-material/LibraryMusic'
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CachedIcon from '@mui/icons-material/Cached';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GradeIcon from '@mui/icons-material/Grade';
import AddCardIcon from '@mui/icons-material/AddCard';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';

import { HealthCheckProps } from "../types"

import StatusCheck from "./StatusCheck"

const Logout = (props: HealthCheckProps) => {
  
  const {loading, setUpdate, urls, reload} = props

  const logout = () => {
    fetch('api/logout')
        .then(() => window.location.href= '/login')
  }

  return (
    <AppBar className="centered" variant="elevation" color="primary" position="sticky">
      <Toolbar>
          {
            <Button title="Click to reload the app" color={loading ? "primary" : "secondary"} variant="contained" onClick={() => {reload()}}>
              {loading ? <CircularProgress color="secondary" size="12px" /> : <CachedIcon color="primary" />}
            </Button>}
          {<StatusCheck key={urls.toString()} urls={urls}/>}
          {!loading && <Button variant="contained" color="secondary" onClick={() => setUpdate({editing: {
                index: -1,
                name: "",
                url: "",
                category: ""
            }, folderOnly: true})} ><BookmarkAddIcon color="primary"/></Button>}
            {!loading && <Button color="secondary" variant="contained" onClick={() => setUpdate({openBrowser: true})}>
      <LibraryMusicIcon color="primary"/>
    </Button>}
          <Button title="Click to logout" color="secondary" variant="contained" onClick={logout}>
            <ExitToAppIcon color="primary"/>
          </Button>
          
          </Toolbar>
    </AppBar>
  );
};

export default Logout;