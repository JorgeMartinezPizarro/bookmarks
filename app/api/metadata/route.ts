
import { NextResponse } from 'next/server';
import { MetadataRequest, MetadataResponse } from '@/app/types';
import { errorMessage, setMetadata } from '@/app/helpers';



export async function POST(request: Request) {  
  try {
    const start = Date.now()
    const body: MetadataRequest = await request.json()
    await setMetadata(body)
    const json: MetadataResponse = {
      error: "",
      message: "Sucesfuly updated metadata in " + (Date.now() - start),
    }
    const string = JSON.stringify(json)
    return new NextResponse(string, {status: 200});
    
  } catch (e) {
    return new NextResponse(errorMessage(e), {status: 500});
  }
}


