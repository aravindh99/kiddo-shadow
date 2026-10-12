import { api } from "../../services/api.js";

export async function loginUser({ username, password }) {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const payload = {
    username: username.trim(),
    password,
  };

  // 🔥 GravityLink already returns JSON
  const res = await api.post("/api/auth/login", payload);
  return res;
}
