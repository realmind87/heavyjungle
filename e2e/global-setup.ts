import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";

/** 1×1 white GIF */
const SAMPLE_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export default async function globalSetup() {
  const root = process.cwd();
  config({ path: path.join(root, ".env") });

  const fixturesDir = path.join(root, "e2e", "fixtures");
  mkdirSync(fixturesDir, { recursive: true });
  writeFileSync(path.join(fixturesDir, "sample.gif"), SAMPLE_GIF);

  if (!process.env.DATABASE_URL) {
    console.warn("[e2e] DATABASE_URL 없음 — E2E 계정 시드 생략");
    return;
  }

  execSync("node scripts/e2e-seed-user.mjs", {
    stdio: "inherit",
    cwd: root,
  });
}
