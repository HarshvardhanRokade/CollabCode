import * as signalR from '@microsoft/signalr';
import axiosInstance from './axiosInstance';

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

  // Get token from cookie via API endpoint
  const res = await axiosInstance.get('/auth/token');
  const token = res.data.token;

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