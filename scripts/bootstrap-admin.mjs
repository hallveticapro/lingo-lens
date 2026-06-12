import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/passwords.ts";

const prisma = new PrismaClient();

function enabled(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const forceBootstrap = enabled(process.env.BOOTSTRAP_ADMIN);

if (!email) {
  console.log("Admin bootstrap skipped: ADMIN_EMAIL is not set.");
  await prisma.$disconnect();
  process.exit(0);
}

const existing = await prisma.adminUser.findUnique({ where: { email } });

if (existing && !forceBootstrap) {
  console.log(`Admin bootstrap skipped: ${email} already exists. Set BOOTSTRAP_ADMIN=true to reset it.`);
  await prisma.$disconnect();
  process.exit(0);
}

if (!password) {
  const reason = existing ? "reset" : "create";
  console.log(`Admin bootstrap skipped: ADMIN_PASSWORD is required to ${reason} ${email}.`);
  await prisma.$disconnect();
  process.exit(0);
}

if (password.length < 8) {
  console.error("Admin bootstrap failed: ADMIN_PASSWORD must be at least 8 characters.");
  await prisma.$disconnect();
  process.exit(1);
}

const passwordHash = hashPassword(password);

if (existing) {
  await prisma.adminUser.update({
    where: { id: existing.id },
    data: { passwordHash }
  });
  console.log(`Admin password reset for ${email}. Remove ADMIN_PASSWORD and set BOOTSTRAP_ADMIN=false after verifying login.`);
} else {
  await prisma.adminUser.create({
    data: {
      email,
      passwordHash
    }
  });
  console.log(`Admin account created for ${email}. Remove ADMIN_PASSWORD after verifying login.`);
}

await prisma.$disconnect();
