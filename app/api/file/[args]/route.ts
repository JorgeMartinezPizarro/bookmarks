import path from 'path';
import fs, { read } from 'fs';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const streamToReadableStream = (readStream: Readable): ReadableStream => {
  return new ReadableStream({
    start(controller) {
      readStream.on('data', (chunk) => controller.enqueue(chunk));
      readStream.on('end', () => controller.close());
      readStream.on('error', (err) => controller.error(err));
    },
  });
};

function errorMessage(error: Error | any): string {
  let message: string
  if (error instanceof Error) {
      message = error.stack || ""
      console.log("An Error ocurred.")
      console.log("==================")
      console.log(error.message)
      console.log("==================")
      console.error(message.split("\n"))
  }
  else message = String(error)
  return message;
}


export async function GET(req: Request) {

  
  const url = new URL(req.url);
  const args = url.pathname.split('/').pop()
  const [folder, name] = args?.split(",") || []  
  const filepath = path.join(process.cwd(), "volume", "media", folder, decodeURIComponent(name));
  const headers = req.headers;
  const range = headers.get("range");
  const stat = fs.statSync(filepath);
  const fileSize = stat.size;
  
  let readStream
  let readableStream
  
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    readStream = fs.createReadStream(filepath, { start, end });
    headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Content-Length', "" + chunksize)
  } else {
    readStream = fs.createReadStream(filepath);
    headers.set('Content-Length', `${stat.size}`);
  }

  readableStream = streamToReadableStream(readStream);

  if (!fs.existsSync(filepath)) {
    return NextResponse.json({ error: 'File not found' + filepath}, { status: 404 });
  }

  if (readStream === null || readStream === undefined)
    return NextResponse.json({ error: 'File not found ' + filepath } , { status: 404 });
  else
    return new NextResponse(readableStream, { headers });
}