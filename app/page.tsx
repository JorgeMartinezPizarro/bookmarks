'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Alert } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import EditBookmarks from './components/EditBookmarks'
import Logout from './components/Logout';
import Bookmarks from './components/Bookmarks';
import AudioPlayer from './components/AudioPlayer';
import { StartPage, Link, Bookmark, MetadataRequest } from "./types"
import Tooltip from './components/Tooltip'
import theme from "./theme"

const emptyPage: StartPage = {
  message: "",
  folderOnly: false,
  bookmarks: {
      main: []
  },
  checkURLs: [],
  audios: [],
  openBrowser: false,
  category: undefined,
  error: "",
  loading: true,
  editing: undefined,
  metadataEditing: undefined,
  currentTrack: undefined,
  currentTime: 0,
  playing: false,
}

// TODO: add notifications
/*

<Button onClick={handleClick}>Open Snackbar</Button>
<Snackbar
  open={open}
  autoHideDuration={6000}
  onClose={handleClose}
  message="Note archived"
  action={action}
/>

*/

const DataPage = () => {

  // TODO: use tooltips
  /*
const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));
  */
  const [data, setData] = useState<StartPage>({...emptyPage});       // State to hold the fetched data
  
  const {category, audios, message, folderOnly, loading, editing, error, bookmarks, checkURLs, metadataEditing, openBrowser} = data

  const setUpdate = useCallback((object: Object) => {
    setData(data => ({
      ...data,
      ...object
    }))
  }, [setData])

  const fetchAll = useCallback(async () => {
    setUpdate({
      loading: true,
    })
    try {
      const response = await fetch(`/api/load`);
      const json = await response.json() as StartPage;
      setUpdate({
        ...json,
        loading: false,
      })
    } catch (err: any) {
      setUpdate({
        error: err,
        loading: false,
      })
    }
  }, [setData])

  // Function to save changes persistently
  const saveChanges = useCallback((updatedData: StartPage) => {
    const options = {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(updatedData),
    }
    setData({
      ...updatedData,
      error: "",
    });
    fetch("/api/save", options)
      .then(res => res.json())
      .then((res) => {
        setData(res.data as StartPage)
      })
      .catch(error => {
        setData({
          ...updatedData,
          error,
        })
      })
  }, [setData]);

  useEffect(() => {
    fetchAll()
  }, [])

  // Function to handle editing a link
  const handleEdit = (link: Link, category: string, index: number) => {
    const updatedData = {...data}
    updatedData.bookmarks[category][index] = {...link}
    updatedData.editing = undefined
    saveChanges(updatedData)
  };

  // Function to handle removing a link
  const handleRemove = (category: string, index: number) => {
    const updatedData = {...data}
    if (index === -1 && category !== "main" && category !== undefined) {
      delete updatedData.bookmarks[category]
      updatedData.category = undefined
      
    } else {
      updatedData.bookmarks[category] = bookmarks[category].filter((_, i) => i !== index) || [];
      updatedData.editing = undefined
    }
    
    saveChanges(updatedData)
  };

  // Function to handle adding a new link
  const handleAdd = useCallback((link: Link, category: string) => {
    const updatedData = {...data}
    if (!updatedData.bookmarks[category])
      updatedData.bookmarks[category] = []
    if (link.url && category)
      updatedData.bookmarks[category].push({...link})
    updatedData.editing = undefined
    updatedData.folderOnly = false
    saveChanges(updatedData)
  }, [saveChanges, data])

  // handle what happens on key press
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    
    
    switch (event.code) {
      case "KeyR": 
        openBrowser === false && metadataEditing === undefined && editing === undefined && 
          fetchAll()
        break;
      case "KeyN": 
        openBrowser === false && metadataEditing === undefined && editing === undefined && 
          setUpdate({
            editing: {
              index: -1,
              category: undefined,
              url: "",
              name: "",
            }
          })
        break;
      case "KeyM": 
        openBrowser === false && metadataEditing === undefined && editing === undefined && category === undefined && 
          setUpdate({openBrowser: true})
        break;
      case "Escape":
        setUpdate({
          openBrowser: false,
          editing: undefined,
          editingMetadata: undefined,
          category: undefined,
        })
        break;
      case "KeyC":
        if (openBrowser === false && metadataEditing === undefined && editing === undefined) {
        const x = [...checkURLs]
        setUpdate({
          chechURLs: []
        })
        setUpdate({
          checkURLs: x,
        })}
        break;
      case "KeyQ":
        if (openBrowser === false && metadataEditing === undefined && editing === undefined) {
          window.confirm("Are you sure you want to logout?") && 
            logout()
        }
        break;
      default:
        break;
    }
    
  }, [setUpdate, fetchAll, checkURLs]);
  
  const logout = () => {
    fetch('api/logout')
        .then(() => window.location.href= '/login')
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, editing, metadataEditing, openBrowser]);
  
  return (
    <ThemeProvider theme={theme}>
      {<Logout setUpdate={setUpdate} loading={loading} reload={() => fetchAll()} urls={checkURLs}/>}
      {<Container>
        <AudioPlayer 
          page={data} 
          setUpdate={setUpdate}
          updateMetadata={(metadataRequest, callback) => {
            const index = audios.findIndex(audio => audio.name === metadataRequest.filename)
            const newData = {...data}
            const newAudio = {
              ...audios[index],
              ...metadataRequest.metadata,
            }
            newData.audios[index] = {...newAudio}
            setData(newData)
            callback(newAudio)
          }}
        />
        {!loading && editing && <EditBookmarks
          folderOnly={folderOnly}
          bookmark={editing}
          onClose={() => setUpdate({editing: undefined, metadataEditing: undefined})} 
          setUpdate={setUpdate}
          handleEdit={handleEdit} 
          handleRemove={handleRemove} 
          handleAdd={handleAdd}/>}  
        {!loading && bookmarks && <Bookmarks {...{
          category: category,
          handleAdd,
          handleEdit,
          handleRemove,
          setUpdate,
          bookmarks: bookmarks || []
        }}></Bookmarks>}
        {!loading && message && <Alert severity="success"><Tooltip htmlString={message}/></Alert>}
        {!loading && error && <Alert severity="error"><Tooltip htmlString={error}/></Alert>}
      </Container>}
    </ThemeProvider>
  );
};

export default DataPage;
