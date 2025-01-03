import { cookies } from "next/headers"; // Importa cookies desde next/headers
import { errorMessage } from "@/app/helpers";

// Save SQL information to a Nextcloud Form
export async function POST(request: Request): Promise<Response> {
  try {
    const params = await request.json();
    const { form, score, steps } = params;

    const apiKey = process.env.NEXTCLOUD_API_KEY;
    const username = process.env.NEXTCLOUD_USERNAME;

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('nc_session_id')?.value;

    if (!sessionCookie) {
      throw new Error('No session cookie found.');
    }

    // Endpoint de Nextcloud para obtener la información del usuario
    const nextcloudUserInfoEndpoint = `${process.env.NEXT_PUBLIC_NEXTCLOUD_URL}/ocs/v2.php/cloud/user`;

    // Realiza la solicitud al API de Nextcloud con la cookie
    const responseX = await fetch(nextcloudUserInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${sessionCookie}`,
        'OCS-APIREQUEST': 'true', // Header necesario para el API de Nextcloud
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Verifica si la solicitud fue exitosa
    if (!responseX.ok) {
      const errorText = await responseX.text();
      throw new Error(`Failed to fetch user info. Status: ${responseX.status}. Response: ${errorText}`);
    }

    // Devuelve la información del usuario como JSON
    const userInfo = await responseX.json();
    
    // Guardar resultados en el formulario de Nextcloud
    const response = await fetch(`${process.env.NEXT_PUBLIC_NEXTCLOUD_URL}/ocs/v2.php/apps/forms/api/v3/forms/${form}/submissions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${username}:${apiKey}`)}`,
        "OCS-APIRequest": "true",
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ answers: {
        1: [score],
        4: [steps],
        5: [userInfo?.ocs?.data?.id]
      } }),
    });

    if (!response.ok) {
      throw new Error("Failed to save data to Nextcloud form.");
    }

    return Response.json({ message: "Data saved successfully." }, { status: 200 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

// Load SQL information from a Nextcloud Form by ID
export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return Response.json({ error: "Form ID is required." }, { status: 400 });
    }

    // Usa la API Key almacenada en variables de entorno
    const apiKey = process.env.NEXTCLOUD_API_KEY;
    const username = process.env.NEXTCLOUD_USERNAME;

    const url = `${process.env.NEXT_PUBLIC_NEXTCLOUD_URL}/ocs/v2.php/apps/forms/api/v3/forms/${formId}/submissions`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${username}:${apiKey}`)}`, // Autenticación básica
        "OCS-APIRequest": "true", // Necesario para las solicitudes OCS
        "Accept": "application/json", // Aceptar JSON como respuesta
      },
      method: "GET"
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch form responses. Status: ${response.status}, Response: ${errorText}`);
    }

    // Convertir la respuesta a JSON
    const data = await response.json();

    // Devolver las respuestas al cliente
    return Response.json(data, { status: 200 })
   
  } catch (error) {
    //console.error("Error in GET handler:", error);
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}