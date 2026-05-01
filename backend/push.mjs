import { config } from "dotenv";
import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";

const cwd = process.cwd();
const envPaths = [
  path.join(cwd, ".env"),
  path.join(cwd, "..", ".env"),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    config({ path: p, override: false });
    console.log("env yuklandi:", p);
  }
}

if (!process.env.DATABASE_URL) {
  console.error("\nXATO: DATABASE_URL topilmadi! backend/.env faylini yarating.");
  process.exit(1);
}

const result = spawnSync("npx", ["drizzle-kit", "push", "--config", "./drizzle.config.ts"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
  cwd,
});

process.exit(result.status ?? 1);
