import { errorMessage } from "@/app/helpers";
import { requireAuth } from "@/app/lib/auth";
import { NextRequest } from "next/server";

// Communicate with CHATGPT using a custom UI
export async function GET(request: NextRequest): Promise<Response> {
  try {

    const user = await requireAuth(request);

    // Extract question from query string
    const url = new URL(request.url);
    const question = url.searchParams.get('question');

    const nextcloudUserInfoEndpoint = `${process.env.NEXTCLOUD_URL}/gpt`;

    if (!question) {
      return Response.json({ error: "No question provided" }, { status: 400 });
    }

    console.log("Enviando request a:", nextcloudUserInfoEndpoint);

    // 🔹 NUEVO: Eliminamos el "system" y solo enviamos la pregunta real
    const body = {
      "messages": [
        { "role": "user", "content": question }
      ]
    };

    // Fetch response from GPT API
    const response = await fetch(nextcloudUserInfoEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle API errors
    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error }, { status: response.status });
    }

    // 🔹 Procesar el output antes de enviarlo a la UI
    const data = await response.text();
    
    return Response.json({ response: data }, { status: 200 });

  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
