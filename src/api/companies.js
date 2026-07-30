import client from "./client";

export function listCompanies() {
  return client.get("/companies").then((res) => res.data.data);
}

export function createCompany(payload) {
  return client.post("/companies", payload).then((res) => res.data.data);
}
