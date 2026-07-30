import client from "./client";

export function listCompanies() {
  return client.get("/companies").then((res) => res.data.data);
}

export function createCompany(payload) {
  return client.post("/companies", payload).then((res) => res.data.data);
}

export function updateCompany(id, payload) {
  return client.patch(`/companies/${id}`, payload).then((res) => res.data.data);
}

export function changeCompanyStatus(id, status) {
  return client.patch(`/companies/${id}/status`, { status }).then((res) => res.data.data);
}
