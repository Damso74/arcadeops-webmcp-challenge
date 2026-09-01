import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", "node_modules", ".data", "artifacts", "coverage", "playwright-report", "test-results"]);
const patterns = [
  ["OpenAI key", /\bsk-[a-zA-Z0-9_-]{32,}\b/],
  ["GitHub token", /\bgh[opsu]_[a-zA-Z0-9]{30,}\b/],
  ["Stripe secret", /\bsk_(?:live|test)_[a-zA-Z0-9]{20,}\b/],
  ["JWT", /\beyJ[a-zA-Z0-9_-]{15,}\.[a-zA-Z0-9_-]{15,}\.[a-zA-Z0-9_-]{10,}\b/],
  ["Database URL", /\bpostgres(?:ql)?:\/\/[^\s"']+/],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["Bearer token", /Bearer\s+[a-zA-Z0-9._-]{24,}/],
];

async function files(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await files(fullPath)));
    else if (entry.isFile() && !/\.(?:png|jpe?g|gif|webp|mp3|mp4|zip|sqlite)$/i.test(entry.name)) found.push(fullPath);
  }
  return found;
}

const findings = [];
for (const filename of await files(root)) {
  const content = (await readFile(filename, "utf8"))
    .replaceAll("postgresql://user:pass@example.test/private", "[documented-test-fixture]")
    .replaceAll("sk-example0123456789secretvalue", "[documented-test-fixture]");
  for (const [name, pattern] of patterns) {
    if (pattern.test(content)) findings.push({ name, file: path.relative(root, filename) });
  }
}

if (findings.length > 0) {
  process.stderr.write(`${JSON.stringify({ ok: false, findings }, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({ ok: true, scannedFiles: (await files(root)).length })}\n`);
}
