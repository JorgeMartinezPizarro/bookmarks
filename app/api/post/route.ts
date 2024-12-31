import { errorMessage } from "@/app/helpers";

// Placeholder for a standard POST request from the UI
export async function POST(request: Request): Promise<Response> {  

  try {

    const params = await request.json();

    const { a, b, c } = params;

    return Response.json(params, {
      status: 200
    })
    
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
