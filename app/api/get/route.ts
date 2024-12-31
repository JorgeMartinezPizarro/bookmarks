import { errorMessage } from "@/app/helpers";

// Placeholder for a standard GET request from the UI
export async function GET(request: Request): Promise<Response> {
  
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      a: searchParams.get("a"),
      b: searchParams.get("b"),
      c: searchParams.get("c"),
    }
    
    return Response.json(params, { status: 200})
  } catch (error) { 
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
