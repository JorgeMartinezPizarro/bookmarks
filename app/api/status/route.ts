export async function GET(request: Request): Promise<Response> {
  
  try {
    const { searchParams } = new URL(request.url)
    const url: string = searchParams.get('check') || "";
    try {
        const response = await fetch(url, {
            method: 'GET',
        });
        const data = await response.text(); 
        
        if (data.includes("Service Under Maintenance")) {
          return Response.json({ error: "" }, { status: 500})  
        }
        
        return Response.json(data, { status: 200})
    } catch (error) {
        return Response.json({ error: "Error fetching " + URL }, { status: 500 });
    }
  } catch (error) { 
    return Response.json({ error: error }, { status: 500 });
  }
}
