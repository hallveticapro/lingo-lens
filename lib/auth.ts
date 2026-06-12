import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";

const cookieName = "ll_admin";

function secret() {
  return process.env.AUTH_SECRET || "development-change-me";
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

export async function createSession(email: string) {
  const expires = Date.now() + 1000 * 60 * 60 * 12;
  const payload = `${email}:${expires}`;
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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
  const [email, expires] = payload.split(":");
  if (!email || Number(expires) < Date.now()) return null;
  return { email };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export function adminEmail() {
  return process.env.ADMIN_EMAIL || "admin@example.com";
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
