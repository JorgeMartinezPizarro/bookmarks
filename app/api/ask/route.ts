import { errorMessage } from "@/app/helpers";

// Communicate with CHATGPT using a custom UI
export async function GET(request: Request): Promise<Response> {
  try {
    // Extract question from query string
    const url = new URL(request.url);
    const question = url.searchParams.get('question');

    if (!question) {
      return Response.json({ error: "No question provided" }, { status: 400 });
    }

    // Construct request body for OpenAI API
    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: question,
        }
      ],
      temperature: 1
    };

    // Fetch response from OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPEN_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle OpenAI API errors
    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error }, { status: response.status });
    }

    // Parse and return response
    const answer = await response.json();
    return Response.json(answer, { status: 200 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
