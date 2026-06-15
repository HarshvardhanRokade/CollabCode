import * as signalR from '@microsoft/signalr';

let connection = null;
let isConnecting = false;

export function getConnection() {
  return connection;
}

export async function startConnection() {
  if (isConnecting) return connection;
  if (connection?.state === 'Connected') return connection;

  isConnecting = true;

  if (connection) {
    try { await connection.stop(); } catch {}
    connection = null;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    isConnecting = false;
    throw new Error('No auth token found');
  }

  const hubUrl = import.meta.env.VITE_HUB_URL;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${hubUrl}?access_token=${token}`, {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .build();

  try {
    await connection.start();
    console.log('SignalR connected!');
    isConnecting = false;
    return connection;
  } catch (err) {
    isConnecting = false;
    connection = null;
    throw err;
  }
}

export async function stopConnection() {
  isConnecting = false;
  if (connection) {
    try { await connection.stop(); } catch {}
    connection = null;
  }
}