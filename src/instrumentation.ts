// src/instrumentation.ts
import { startKeepAlive } from "@/lib-server/keepalive";

export async function register() {
  // รันเฉพาะบน node runtime (server)
  startKeepAlive();
}
