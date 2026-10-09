const API_URL = import.meta.env.VITE_API_URL;

export async function signUp(name, email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not create your account.");

  localStorage.setItem("token", data.token);
  return data.user;
}

export async function logIn(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Incorrect email or password.");

  localStorage.setItem("token", data.token);
  return data.user;
}

export function logOut() {
  localStorage.removeItem("token");
}