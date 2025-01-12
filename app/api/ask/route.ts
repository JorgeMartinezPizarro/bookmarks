import { errorMessage } from "@/app/helpers";

// Communicate with CHATGPT using a custom UI
export async function GET(request: Request): Promise<Response> {
  try {
    // Extract question from query string
    const url = new URL(request.url);
    const question = url.searchParams.get('question');

    const nextcloudUserInfoEndpoint = `${process.env.NEXT_PUBLIC_NEXTCLOUD_URL}/gpt/gpt`;

    if (!question) {
      return Response.json({ error: "No question provided" }, { status: 400 });
    }

    console.error(nextcloudUserInfoEndpoint)

    // Construct request body for OpenAI API
    const body = {
      "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": question}
      ]
    }

    // Fetch response from OpenAI
    const response = await fetch(nextcloudUserInfoEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle OpenAI API errors
    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error }, { status: response.status });
    }

    console.log(body)

    // Parse and return response
    const answer = await response.json();
    return Response.json(answer, { status: 200 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
