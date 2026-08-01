import client from "./client";

export function listUsers() {
  return client.get("/users").then((res) => res.data.data);
}

export function createUser(payload) {
  return client.post("/users", payload).then((res) => res.data.data);
}

export function changeUserStatus(id, status) {
  return client.patch(`/users/${id}/status`, { status }).then((res) => res.data.data);
}

export function resetUserPassword(id, newPassword) {
  return client.patch(`/users/${id}/reset-password`, { newPassword }).then((res) => res.data.data);
}
