import * as signalR from '@microsoft/signalr';

let connection = null;
let isConnecting = false;

export function getConnection() {
  return connection;
}

export async function startConnection(token) {
  // Prevent double connection from React Strict Mode
  if (isConnecting) return connection;
  if (connection?.state === 'Connected') return connection;

  isConnecting = true;

  // Stop existing connection cleanly
  if (connection) {
    try { await connection.stop(); } catch {}
    connection = null;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`https://localhost:7222/hubs/code?access_token=${token}`, {
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