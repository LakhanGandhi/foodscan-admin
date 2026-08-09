import client from "./client";

export function getPendingForCompany(companyId) {
  return client.get(`/change-requests/company/${companyId}/pending`).then((res) => res.data.data);
}

export function listPendingChangeRequests() {
  return client.get("/change-requests/pending").then((res) => res.data.data);
}

export function approveChangeRequest(id) {
  return client.patch(`/change-requests/${id}/approve`).then((res) => res.data.data);
}

export function rejectChangeRequest(id) {
  return client.patch(`/change-requests/${id}/reject`).then((res) => res.data.data);
}
