import ky from "ky";

export const apiClient = ky.create({
  prefixUrl: "/api",
  retry: 2,
  timeout: 15000,
});
