const NEXTCLOUD_URL = "https://mptree.es";
const ADMIN_USER = "admin";
const PWD = "NCyM9-eAgm9-p8mji-P3NFE-HSJsX"

// Función para obtener la lista de usuarios
async function getUsers(): Promise<string[]> {
    const response = await fetch(`${NEXTCLOUD_URL}/ocs/v1.php/cloud/users?format=json`, {
        method: "GET",
        headers: {
            "OCS-APIRequest": "true",
            "Content-Type": "application/json",
            "Authorization": "Basic " + btoa(`${ADMIN_USER}:${PWD}`)
        }
    });

    if (!response.ok) {
        throw new Error(`Error al obtener usuarios: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.ocs.data.users; // Retorna un array con los nombres de usuario
}

async function sendNotification(userId: string) {
    const payload = new URLSearchParams();
    payload.append("shortMessage", "A new audio has been published by user!");
    payload.append("link", "https://mptree.es/network");
    
    const response = await fetch(`${NEXTCLOUD_URL}/ocs/v2.php/apps/notifications/api/v2/admin_notifications/${userId}`, {
        method: "POST",
        headers: {
            "OCS-APIRequest": "true",
            "Authorization": "Basic " + btoa(`${ADMIN_USER}:${PWD}`),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: payload.toString()
    });

    if (!response.ok) {
        console.error(`❌ Error al enviar notificación a ${userId}: ${response.statusText}`);
    } else {
        console.log(`✅ Notificación enviada a ${userId}`);
    }
}

// Función principal para enviar la notificación a todos los usuarios
export async function sendNotificationsToAll() {
    try {
        const users = await getUsers();
        console.error(`Usuarios encontrados: ${users.join(", ")}`);

        for (const user of users) {
            await sendNotification(user);
        }

        console.error("✅ Notificaciones enviadas correctamente.");
    } catch (error) {
        console.error("❌ Error al enviar notificaciones:", error);
    }
}
