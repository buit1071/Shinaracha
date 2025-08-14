import { fetchJSON } from "@/lib/fetcher";
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type User = { id: string; name: string };

export const UserService = {
  me: () => fetchJSON<User>(`${BASE}/api/health`), // แทนด้วย endpoint จริงภายหลัง
};
