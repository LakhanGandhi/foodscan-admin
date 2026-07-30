import client from "./client";

export function listPlants() {
  return client.get("/plants").then((res) => res.data.data);
}

export function createPlant(payload) {
  return client.post("/plants", payload).then((res) => res.data.data);
}

export function updatePlant(id, payload) {
  return client.patch(`/plants/${id}`, payload).then((res) => res.data.data);
}
