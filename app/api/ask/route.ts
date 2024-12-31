import { errorMessage } from "@/app/helpers";

// Communicate with CHATGPT using a custom UI
export async function GET(request: Request): Promise<Response> {
  
  try {
    const params = await request.json();

    const { question } = params;

    const body = {
      "model": "gpt-4",
      "messages": [
        {
          "role": "assistant",
          "content": question,
        }
      ],
      "temperature": 1
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPEN_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const answer = await response.json();
    return Response.json(answer, { status: 200})
  } catch (error) { 
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
