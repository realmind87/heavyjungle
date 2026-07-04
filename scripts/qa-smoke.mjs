#!/usr/bin/env node
/**
 * 로컬 QA 스모크 — health·주요 페이지·vitest
 * Usage: npm run qa:smoke  (dev 서버 실행 중 권장)
 */
import { execSync } from "node:child_process";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";

const checks = [
  { name: "health API", url: `${BASE}/api/health`, expect: 200 },
  { name: "home", url: `${BASE}/`, expect: 200 },
  { name: "login", url: `${BASE}/login`, expect: 200 },
  { name: "notices", url: `${BASE}/notices`, expect: 200 },
];

async function checkStatus({ name, url, expect: expected }) {
  const res = await fetch(url, { redirect: "manual" });
  const ok = res.status === expected || (expected === 200 && res.status === 307);
  if (!ok) {
    throw new Error(`${name}: ${url} → ${res.status} (expected ${expected})`);
  }
  console.log(`  ✓ ${name} (${res.status})`);
}

console.log("==> QA smoke — HTTP");
for (const check of checks) {
  await checkStatus(check);
}

console.log("==> QA smoke — unit tests");
execSync("npm run test", { stdio: "inherit" });

console.log("\n==> QA smoke passed");
