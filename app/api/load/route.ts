import path from 'path';
import fs from 'fs';
import metadata from './metadata'
import utf8 from 'utf8';
import * as cheerio from 'cheerio';

import {StartPage, Bookmarks, Track, Bookmark, Link } from "../../types"
import { errorMessage } from '@/app/helpers';


// TODO: add preload from favorites.html export from browser
// TODO: load bookmarks or favorites
// TODO: add category and isPersonalFolder variables to bookmarks
export async function GET(request: Request): Promise<Response> {  
  const start = Date.now()
    
    
    const bookmarksPath = process.env.BOOKMARKS_DATA_FOLDER + '/bookmarks.json';
    const checkURLsPath = process.env.BOOKMARKS_DATA_FOLDER + '/check.json';
    const audioDirectory = process.env.BOOKMARKS_MUSIC_FOLDER + "";
    
  const loadOriginalBookmarks = () => {

    const originalBookmarksPath = process.env.BOOKMARKS_DATA_FOLDER + '/bookmarks.html';

    const bookmarks: Bookmarks = {main: []}
    const html = fs.readFileSync(originalBookmarksPath, 'utf8');
        const $ = cheerio.load(html);
        $("dl dl").each((index, item) => {
          $(item).find("dt").each((i, block) => {
            const category = $(block).find("h3").text();
            if (category) {
              bookmarks[category] = []
              const list = $(`:contains(${category})`).nextAll('dl').first()
              list.find("a").each((j, link) => {
                bookmarks[category].push({
                  url: $(link).attr("href") || "",
                  pos: 0,
                  name: $(link).html() || "",
                })
              });
            }
          })
        })
    
        $("body > dl > dt > dl > dt > a").each((i, link) => {
          bookmarks.main.push({
            url: $(link).attr("href") || "",
            pos: i,
            name: $(link).html() || "",
          })
        })

    return bookmarks

  }

  try {
    
    // Read the bookmarks.html file
    let message = ''
    let bookmarks: Bookmarks = {main: []}
    let audios: Track[] = []
    let checkURLs = []

    try {
      if (fs.existsSync(bookmarksPath)) {
        const html = fs.readFileSync(bookmarksPath, 'utf8');
        bookmarks = JSON.parse(html)
      } else {
        message += `\n${bookmarksPath} not found, loading from original google bookmarks.html`
        bookmarks = loadOriginalBookmarks()
      }
      
    } catch (err) {
      message += `\nTry to read from original bookmarks.html`
      bookmarks = loadOriginalBookmarks()
    }
    
    try {
      checkURLs = JSON.parse(fs.readFileSync(checkURLsPath, 'utf8'));
    } catch (err) {
      message += `\nFailed to load the check urls from ` + checkURLsPath
      checkURLs = []
    }

    try {
      audios = await Promise.all(
        fs.readdirSync(audioDirectory).filter(file => file !== "NO_REMOVE").map( async file => {
          try {
            const data = await metadata(path.join(audioDirectory, file));
            return {
              name:  decodeURIComponent(file),
              title: decodeURIComponent(data.common.title||""),
              album: decodeURIComponent(data.common.album||""),
              artist: decodeURIComponent(data.common.artist||""),
              genre: decodeURIComponent(data.common.genre?.join(",")||""),
              duration: data.format.duration
            }
          } catch (e) {
            message += "\nFailed to read the file " + file + "\n" + errorMessage(e)
            return {
              name: file,
              title: "",
              album: "",
              artist: "",
              genre: "",
              duration: -1
            }  
          }
        })
      )
    } catch (e) {
      message += `\nError reading audios from ${audioDirectory}\n${e}`
      
    }

    const duration = (Date.now() - start)

    const response: StartPage = {
      message: "It took " + duration + " ms" + " to load the system.\n\n" + message,
      audios: audios.filter((a: Track) => a.duration !== -1),
      bookmarks,
      checkURLs,
      openBrowser: false,
      category: undefined,
      folderOnly: false,
      editing: undefined,
      error: "",
      loading: false,
      metadataEditing: undefined,
      currentTime: 0,
      currentTrack: undefined,
      playing: false, 
    } 
    return new Response(JSON.stringify(response), {
      headers: { 
        'Content-Type': 'application/json; chatset=utf-8',
      }
    });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
