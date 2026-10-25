import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const target = "src/shared/api/schema.d.ts";
const before = readFileSync(target, "utf8");
const result = spawnSync(
  process.execPath,
  [
    "node_modules/openapi-typescript/bin/cli.js",
    "contracts/openapi.json",
    "-o",
    target,
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
if (readFileSync(target, "utf8") !== before) {
  console.error(
    "Generated API types changed. Run npm run api:generate and commit the result.",
  );
  process.exit(1);
}
