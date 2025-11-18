// src/api/client.js
const API_URL = "http://localhost:8000"; // Ajusta si usas otra IP o puerto

export async function getUsers() {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) {
    throw new Error("Error al obtener usuarios");
  }
  return await res.json();
}

export async function createUser(userData) {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    throw new Error("Error al crear usuario");
  }

  return await res.json();
}

export async function getServices() {
  const res = await fetch(`${API_URL}/services`);
  if (!res.ok) {
    throw new Error("Error al obtener servicios");
  }
  return await res.json();
}
