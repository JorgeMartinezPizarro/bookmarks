import { cookies } from "next/headers"; // Importa cookies desde next/headers
import { errorMessage } from "@/app/helpers";
import sqlite3 from 'sqlite3';

// Save game score to SQLITE
export async function POST(request: Request): Promise<Response> {
  try {
    
    // Read parameters
    const params = await request.json();
    const { form, answers, user } = params;

    const apiKey = process.env.NEXTCLOUD_API_KEY;
    const username = process.env.NEXTCLOUD_USERNAME;

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('nc_session_id')?.value;


    // Request username
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

    


    
    const x = {...answers}
    x[user] = [userInfo?.ocs?.data?.id]

    const body = { 
      answers: x
    } 

    

    // Guardar resultados en el formulario de Nextcloud
    const response = await fetch(`${process.env.NEXT_PUBLIC_NEXTCLOUD_URL}/ocs/v2.php/apps/forms/api/v3/forms/${form}/submissions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${username}:${apiKey}`)}`,
        "OCS-APIRequest": "true",
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
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

// Enable verbose mode for debugging
sqlite3.verbose();

// Open or create the SQLite database file
const db = new sqlite3.Database('./my_database.db', (err: Error | null) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create the "results" table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data TEXT
      )`,
      (err: Error | null) => {
        if (err) {
          console.error('Error creating table:', err.message);
        } else {
          console.log('Table "results" is ready.');
        }
      }
    );
  }
});

/**
 * Inserts a new record into the "results" table.
 *
 * @param data - The string to insert.
 * @param callback - A callback function that receives an error (if any) or the last inserted ID.
 */
export function insertData(
  data: string,
  callback: (err: Error | null, lastID?: number) => void
): void {
  const sql = `INSERT INTO results(data) VALUES(?)`;
  db.run(sql, [data], function (this: sqlite3.RunResult, err: Error | null) {
    if (err) {
      console.error('Error inserting data:', err.message);
      callback(err);
    } else {
      console.log(`Inserted row with rowid ${this.lastID}`);
      callback(null, this.lastID);
    }
  });
}

/**
 * Selects all records from the "results" table.
 *
 * @param callback - A callback function that receives an error (if any) or an array of rows.
 */
export function selectData(
  callback: (err: Error | null, rows?: { id: number; data: string }[]) => void
): void {
  const sql = `SELECT id, data FROM results`;
  db.all(sql, [], (err: Error | null, rows: { id: number; data: string }[]) => {
    if (err) {
      console.error('Error selecting data:', err.message);
      callback(err);
    } else {
      console.log('Selected rows:', rows);
      callback(null, rows);
    }
  });
}