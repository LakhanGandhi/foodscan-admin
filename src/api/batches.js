import client from "./client";

export function listBatches() {
  return client.get("/batches").then((res) => res.data.data);
}

export function createBatch(payload) {
  return client.post("/batches", payload).then((res) => res.data.data);
}

export function updateBatch(id, payload) {
  return client.patch(`/batches/${id}`, payload).then((res) => res.data.data);
}
