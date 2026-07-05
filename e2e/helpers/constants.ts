import path from "node:path";

export const E2E_USERNAME = process.env.E2E_USERNAME ?? "e2e_user";
export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "e2e-test-password";

export const SAMPLE_GIF_PATH = path.join(process.cwd(), "e2e/fixtures/sample.gif");
