export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
  apiSecretKey: process.env.API_SECRET_KEY ?? "",
} as const;
