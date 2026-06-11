import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const argPassword = process.argv[2];
const rl = argPassword ? null : createInterface({ input, output });
const password = argPassword ?? (await rl.question("Admin password to hash: "));
rl?.close();

if (!password || password.length < 8) {
  console.error("Use a password with at least 8 characters.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`scrypt:${salt}:${hash}`);
