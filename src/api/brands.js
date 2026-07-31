import client from "./client";

export function listBrands() {
  return client.get("/brands").then((res) => res.data.data);
}

export function createBrand(payload) {
  return client.post("/brands", payload).then((res) => res.data.data);
}

export function updateBrand(id, payload) {
  return client.patch(`/brands/${id}`, payload).then((res) => res.data.data);
}
