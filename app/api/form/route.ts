import { errorMessage } from "@/app/helpers";

// Save and Load SQL information using Nextcloud Forms
export async function POST(request: Request): Promise<Response> {  

  try {

    const params = await request.json();

    /*

      // LOAD and save data to Nextcloud forms
      const fetchFormParams = async (formId, userCookie) => {
        const response = await fetch(`/nextcloud/forms/api/${formId}`, {
          headers: { Cookie: userCookie },
        });
        const params = await response.json();
        return params;
      };

      const saveGameResults = async (formId, userHash, results) => {
        await fetch(`/nextcloud/forms/api/${formId}/responses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userHash, results }),
        });
      };

    */
    const { a, b, c } = params;

    return Response.json(params, {
      status: 200
    })
    
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
