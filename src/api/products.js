import client from "./client";

export function listProducts() {
  return client.get("/products").then((res) => res.data.data);
}

export function createProduct(payload) {
  return client.post("/products", payload).then((res) => res.data.data);
}

export function updateProduct(id, payload) {
  return client.patch(`/products/${id}`, payload).then((res) => res.data.data);
}
