const API_URL = "http://localhost:3000";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    console.error("JWT decode error:", e);
    return null;
  }
}

export async function registerUser(data) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginUser(data) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getUserData(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.username) {
    console.error("Некоректний токен або відсутній username у payload");
    return null;
  }

  const username = decoded.username.replace(/^@/, "");
  const res = await fetch(`${API_URL}/api/v1/users/${username}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
