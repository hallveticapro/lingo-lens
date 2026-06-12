import { PrismaClient } from "@prisma/client";
import { bootstrapReferenceData } from "@/lib/reference-data";

const prisma = new PrismaClient();

try {
  const result = await bootstrapReferenceData(prisma);
  console.log(`Reference data ready: ${result.levels.length} reading levels, ${result.english.bcp47Tag}, ${result.spanish.bcp47Tag}.`);
} finally {
  await prisma.$disconnect();
}
