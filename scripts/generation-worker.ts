import { prisma } from "../lib/prisma";
import { processNextGenerationJob } from "../lib/generation";

function numberEnv(name: string, fallback: number) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const pollMs = numberEnv("GENERATION_WORKER_POLL_MS", 5000);
let shuttingDown = false;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.info(
    JSON.stringify({
      level: "info",
      scope: "generation-worker",
      message: "Generation worker started",
      pollMs
    })
  );

  while (!shuttingDown) {
    const processed = await processNextGenerationJob();
    if (!processed) await wait(pollMs);
  }
}

process.on("SIGTERM", () => {
  shuttingDown = true;
});

process.on("SIGINT", () => {
  shuttingDown = true;
});

try {
  await run();
} finally {
  await prisma.$disconnect();
}
