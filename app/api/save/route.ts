import { StartPage } from '@/app/types';
import { StarPurple500 } from '@mui/icons-material';
import fs from 'fs';
import { start } from 'repl';

function errorMessage(error: Error | any): string {
    let message: string
    if (error instanceof Error) {
        message = error.message
        console.log("An Error ocurred.")
        console.log(message)
        console.log(error.stack?.split("\n").slice(0, 5).join("\n"))
    }
    else message = String(error)
    return message;
}

// TODO: allow save bookmarks or favorites, both in json
export async function POST(request: Request): Promise<Response> {  

  try {

    const data: StartPage = await request.json();
    
    const bookmarksPath = process.env.BOOKMARKS_DATA_FOLDER + '/bookmarks.json';
    
    // Write the HTML content to a file
    fs.writeFile(bookmarksPath, JSON.stringify(data.bookmarks, null, 2), (err) => {
      if (err) {
        return Response.json({error: "Failed to write the bookmarks file" }, {status: 500});
      }
    });
    
    return Response.json({
      data: {
        ...data,
        message: "Successfuly saved bookmarks", 
      },
    })
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
