import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const defaultFiles = [
  "scripts/test-affiliate-import.mjs",
  "scripts/test-discovery.mjs",
  "scripts/test-monetization.mjs",
  "scripts/test-ad-network.mjs",
];

const args = process.argv.slice(2);
let pattern = null;
let coverage = false;
const explicitFiles = [];

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--coverage") {
    coverage = true;
    continue;
  }
  if (arg.startsWith("--testPathPattern=")) {
    pattern = arg.slice("--testPathPattern=".length);
    continue;
  }
  if (arg === "--testPathPattern") {
    pattern = args[index + 1];
    index += 1;
    continue;
  }
  if (arg.startsWith("-")) {
    console.error(`Unknown test argument: ${arg}`);
    process.exit(1);
  }
  explicitFiles.push(arg);
}

let files = explicitFiles.length > 0 ? explicitFiles : defaultFiles;

if (pattern) {
  let expression;
  try {
    expression = new RegExp(pattern);
  } catch (error) {
    console.error(`Invalid --testPathPattern: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  files = files.filter((file) => expression.test(file));
}

if (files.length === 0) {
  console.error(`No test files matched pattern ${pattern ?? ""}`.trim());
  process.exit(1);
}

const nodeArgs = ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--test"];

if (coverage) {
  mkdirSync("coverage", { recursive: true });
  nodeArgs.push(
    "--experimental-test-coverage",
    "--test-reporter=spec",
    "--test-reporter=lcov",
    "--test-reporter-destination=stdout",
    "--test-reporter-destination=coverage/lcov.info",
  );
}

nodeArgs.push(...files);

const result = spawnSync(process.execPath, nodeArgs, { stdio: "inherit" });
process.exit(result.status ?? 1);
