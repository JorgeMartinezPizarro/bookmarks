import { errorMessage } from "@/app/helpers";
import { requireAuth } from "@/app/lib/auth";
import { NextApiRequest } from "next";
import { NextRequest } from "next/server";

// TODO: Use websocket to read files in real time
export async function GET(request: Request) {

  try {
    await requireAuth(request)
    
    const { searchParams } = new URL(request.url || "")
    
    const params = {
      name: searchParams.get("name"),
    }
    
    const url = process.env.NEXTCLOUD_URL + '/reports/' + params.name + '.txt'

    const credentials = btoa(
      process.env.SYSTEM_REPORTS_USER + ":" + process.env.SYSTEM_REPORTS_PASS
    )

    const response = await fetch(
      url,
      {
        headers: {
          'Authorization': 'Basic ' + credentials,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      }
    )
		
    if (!response.ok) throw new Error("Error accessing to " + url +  "\n" + response.statusText)
    
    
    const text = await response.text()

    
    
    return Response.json({content: text}, { status: 200})
  } catch (error) { 
    return Response.json({ error: "Error in route report. \n" + errorMessage(error) }, { status: 500 });
  }
}
