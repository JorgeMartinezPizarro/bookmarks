
import NodeID3 from 'node-id3';
import path from 'path';
import { MetadataRequest } from './types';

export function errorMessage(error: Error | any): string {
    let message: string
    if (error instanceof Error) {
        message = error.stack || ""
        console.error("An Error ocurred.")
        console.error("==================")
        console.error(message.split("\n"))
    }
    else message = String(error)
    return message;
}

export const setMetadata = (values: MetadataRequest) => {
    return new Promise((resolve, reject) => {
      
      const inputFilePath = path.join(process.cwd(), "volume", "media", "audio", values.filename);
      
      // Write tags to an MP3 file
      NodeID3.write(values.metadata, inputFilePath, (err) => {
        if (err) {
          console.error("Error updating MP3 metadata")
          console.error(errorMessage(err));
          reject(err)
        } else {
          resolve(true)
          console.log("MP3 metadata updated successfully for file " + values.filename);
        }
      })
    })
  }