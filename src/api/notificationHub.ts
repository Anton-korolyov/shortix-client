import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

const API = import.meta.env.VITE_API_URL;

export async function startNotificationHub() {

  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API}/hubs/notifications`, {
      accessTokenFactory: () =>
        localStorage.getItem("accessToken") || ""
    })
    .withAutomaticReconnect()
    .build();

  try {
    await connection.start();
    console.log("SignalR connected");
  }
  catch (err) {
    console.error("SignalR error:", err);
    connection = null;
  }

  return connection;
}

export function getNotificationConnection() {
  return connection;
}

export async function stopNotificationHub() {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}