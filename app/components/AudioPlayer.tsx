'use client'

import { useCallback, useEffect } from 'react';
import { Edit as EditIcon, LastPage as LastPageIcon, FirstPage as FirstPageIcon }  from '@mui/icons-material/';
import { BottomNavigation , TableBody, Table, TableRow, TableCell, TextField, Modal, Button } from '@mui/material';

import { AudioPlayerProps, MetadataKey, MetadataResponse, Track } from '../types'



const AudioPlayer = (props: AudioPlayerProps) => {
  
  const player = (filename: string = "") => {

    const src = "/api/file/audio," + filename

    const audio = document.getElementsByTagName("audio")[0] as HTMLAudioElement
    if (filename) {
      audio.src = src;
    }
    return audio
  }

  const {playing, audios, openBrowser, metadataEditing, loading, currentTime, currentTrack } = props.page;
  const {setUpdate, updateMetadata} = props
  
  const play = useCallback(() => {
    if (currentTrack === undefined) {
      setUpdate({
        message: "",
        error: "No audio selected to play!"
      })
      return
    }
    player().play()
    setUpdate({
      playing: true,
      message: "Playing audio " + currentTrack.name,
      error: ""
    })
  }, [currentTrack, setUpdate])

  const pause = useCallback(() => {
    if (currentTrack?.name === undefined) {
      setUpdate({
        message: "No audio selected to pause!",
        error: "",
        playing: false
      })
      return
    }
    
    player().pause()
    setUpdate({
      playing: false,
      message: "Pause audio " + currentTrack.name + " at second " + currentTime,
      error: ""
    })
    
  }, [currentTrack?.name, currentTime, setUpdate])

  const reload = useCallback(() => {
    if (currentTrack === undefined) {
      setUpdate({
        message: "No audio selected to reload",
        error: ""
      })
      return
    } else {
      player().currentTime = 0
      setUpdate({
        currentTime: 0,
      })
    }
  }, [setUpdate, currentTrack])

  const setRandomTrack = useCallback(() => {
    setUpdate({
      currentTrack: audios[Math.floor(Math.random()*audios.length)],
      message: "changed media to " + currentTrack?.name,
      error: "",
    })
  }, [currentTrack, setUpdate, audios])

  const previoustrack = useCallback(() => {
    reload()
  }, [currentTime, reload])

  const nexttrack = useCallback(() => {
    setRandomTrack()
  }, [setRandomTrack])
  
  const updateMediaSession = useCallback(() => {
    if (typeof navigator !== 'undefined') {
      navigator.mediaSession.setActionHandler('previoustrack', previoustrack);
      navigator.mediaSession.setActionHandler('nexttrack', nexttrack);
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', pause);
    
      if (currentTrack !== undefined) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title || currentTrack.name,
          artist: currentTrack.artist,
          album: currentTrack.album,
          artwork: [
              { src: '/background.png', sizes: '512x512', type: 'image/png' },
          ]
        });
      }
    }
  }, [currentTrack])

  useEffect(() => {
    if (currentTrack?.name)
      player(currentTrack.name)
      playing && play()
    if (currentTrack) {
      updateMediaSession()
    } 
  }, [currentTrack])

  useEffect(() => {
    setUpdate({
      currentTrack: audios[0]
    })
  }, [audios, setUpdate])
  
  const saveMetadata = useCallback(() => {
    const options = {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(metadataEditing),
    }
    
    fetch("/api/metadata", options)
      .then(res => res.json())
      .then((res: MetadataResponse) => {
        metadataEditing !== undefined && updateMetadata(metadataEditing, (track: Track) => {
          setUpdate({
            currentTrack: track,
            metadataEditing: undefined,
            message: res.message,
            error: ""
          })        
        })
      })
  }, [metadataEditing, setUpdate])

  const displayName = [
    (currentTrack?.title || currentTrack?.name.replace(".mp3", "") || "Unknown") + " - " + (Math.round(currentTime) || 0) + " of " + (Math.round((currentTrack?.duration || 0)) || 0) + " seconds."
  ]

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    
    const stop = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()
    }

    switch (event.code) {
      case "KeyA":
        previoustrack()
        setUpdate({
          error: "handled A key, playing previoustrack",
        })
        break;
      case "KeyS":
        playing ? pause() : play()
        setUpdate({
          error: "handled S key, play or pause",
        })
        break;
      case "KeyD":
        nexttrack()
        setUpdate({
          error: "handled D key, playing nexttrack",
        })
        break;
    }   
    
    
  }, [setUpdate, playing, pause, play, nexttrack, previoustrack]);

  useEffect(() => {
    // remove the event listener
    document.removeEventListener('keydown', handleKeyPress);
    // attach the event listener
    if (openBrowser === false && metadataEditing === undefined)
      document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, openBrowser, metadataEditing]);

  return <>

    {metadataEditing !== undefined && 
      <Modal open={true}><>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2}>
                Edit metadata for  {metadataEditing.filename}
              </TableCell>
            </TableRow>
            {["title", "album", "artist", "genre"].map((string, index) => {
              const t = string as MetadataKey
              return <TableRow key={t}>
                <TableCell>
                  {t}
                </TableCell>
                <TableCell>
                  <TextField 
                    key={t}
                    name={t} 
                    value={metadataEditing.metadata !== undefined ? metadataEditing.metadata[t] : ""}
                    onChange={(e) => {
                      const newEditing = {
                        ...metadataEditing
                      }
                      newEditing.metadata[t] = e.target.value
                      setUpdate({
                        metadataEditing: newEditing
                      })
                  }}/>
                </TableCell>
              </TableRow>
            })}
          </TableBody>
        </Table>
        <BottomNavigation >
          <Button color="secondary" variant="contained" onClick={() => {
            setUpdate({metadataEditing: undefined})
          }}>CLOSE</Button>
          {metadataEditing !== undefined && metadataEditing.metadata !== undefined && <Button color="primary" variant="contained" onClick={() => {
            window.confirm("\nDo you really want to save the following link:\n\n " + (Object.keys(metadataEditing.metadata) as MetadataKey[]).map(key => "\n - " + key + ": " + metadataEditing.metadata[key]).join("")) && 
              saveMetadata()
          }}>SAVE</Button>}
        </BottomNavigation >
        </>
    </Modal>}
    {audios && openBrowser && <Modal
        open={true}
    >
      <>
        <BottomNavigation >
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => {
              setUpdate({
                openBrowser: false,
                metadataEditing: undefined
              })
            }}
          >
            Close
          </Button>
        </BottomNavigation >
        <Table> 
          <TableBody>
          <TableRow><TableCell colSpan={2}>Manage the metadata of your own mp3 collection</TableCell></TableRow>
          {[currentTrack, ...audios.filter(audio => audio.name !== currentTrack?.name)].map((track, index) => {
          const displayName = (track?.title && track?.title.split(" - ") || track?.name.split(" - ")[0] || "Unknown") + " " +  Math.round((track?.duration || 0) / 60) + " minutes"
          return <TableRow color={track?.name === currentTrack?.name ? "secondary" : "primary"} key={index}>
          <TableCell  style={{width: "12px"}} onClick={()=> {
            setUpdate({
              openBrowser: false,
              metadataEditing: track !== undefined ? {
                filename: track.name || "",
                metadata: {
                  title: track.title || "",
                  artist: track.artist || "",
                  album: track.album || "",
                  genre: track.genre || "",
                }
                  } : undefined
                })
              }} title={"Edit the metadata of " + track?.name} ><EditIcon color="success" accentHeight={13} /></TableCell>
              <TableCell onClick={() => {
                play()
                setUpdate({
                  openBrowser: false,
                  metadataEditing: undefined,
                  currentTrack: track,
                })
              }} title="click to play this song!">
                {displayName}
              </TableCell>
            </TableRow>
            })}
              </TableBody>
        </Table>
      </>
    </Modal>}
    <audio 
      hidden
      key={"dont-update-me"}
      onTimeUpdate={e => {
        const player = e.target as HTMLAudioElement
        setUpdate({currentTime: player.currentTime})
      }} 
      onEnded={nexttrack} 
    />
    {currentTrack !== undefined && <>
      
      <Button color="secondary" variant="contained" onClick={previoustrack}>
        <FirstPageIcon color="primary" />
      </Button>
      <Button onClick={playing ? pause : play} style={{overflow: "hidden", width: "calc(100% - 146px)"}} color={playing ? "primary" : "secondary"} variant="contained">
        {displayName}
      </Button>
      <Button color="secondary" onClick={nexttrack} variant="contained">
        <LastPageIcon color="primary"/>
      </Button>
    </>}
  </>
};

export default AudioPlayer;
