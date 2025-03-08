import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request): Promise<Response> {
  try {
    // Obtener el nombre del archivo desde los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    // Asegurar que el archivo es un .mp3
    if (!fileName.endsWith('.mp3')) {
      return NextResponse.json({ error: 'Only MP3 files are allowed' }, { status: 403 });
    }

    // Construir la ruta absoluta del archivo dentro de la carpeta "top"
    const filePath = path.join(process.cwd(), 'audio', fileName);

    // Leer el archivo
    const fileData = await fs.readFile(filePath);

    // Retornar el archivo como un audio MP3 con soporte para streaming
    return new Response(fileData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Accept-Ranges': 'bytes',  // Permite reproducción en stream
      },
    });

  } catch (error) {
    console.error('Error fetching MP3 file:', error);
    return NextResponse.json({ error: 'MP3 file not found or access denied' }, { status: 404 });
  }
}
