import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "jose";

const key = new TextEncoder().encode(process.env.JWT_SECRET || "dev");
const alg = "HS256";

// กำหนด payload ให้ถูกชนิด
export async function signJwt(
  payload: JWTPayload,
  maxAgeSec = 60 * 60 * 8
) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(key);
}

// verify แบบมีชนิดคืนค่า
export async function verifyJwt<T extends JWTPayload = JWTPayload>(token: string) {
  const { payload } = await jwtVerify(token, key, { algorithms: [alg] });
  return payload as T;
}
