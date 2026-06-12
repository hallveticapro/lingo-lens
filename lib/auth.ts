import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { adminEmail as configuredAdminEmail, authSecret, isProduction } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";

const cookieName = "ll_admin";

function secret() {
  return authSecret();
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function verifySigned(value: string, signature: string) {
  const expected = sign(value);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function encodePayload(payload: { email: string; expires: number }) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string) {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as { email?: unknown; expires?: unknown };
    if (typeof payload.email !== "string" || typeof payload.expires !== "number") return null;
    return { email: payload.email, expires: payload.expires };
  } catch {
    return null;
  }
}

export async function createSession(email: string) {
  const expires = Date.now() + 1000 * 60 * 60 * 12;
  const payload = encodePayload({ email, expires });
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    expires: new Date(expires)
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !verifySigned(payload, signature)) return null;
  const session = decodePayload(payload);
  if (!session || session.expires < Date.now()) return null;
  return { email: session.email };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export function adminEmail() {
  return configuredAdminEmail();
}

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) return false;

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() }
  });
  return true;
}

export const adminCookieName = cookieName;
