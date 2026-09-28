import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const version = "1.18.1";
// Official release assets and SHA-256 digests from gleam-lang/gleam v1.18.1.
const releases = {
  "darwin-arm64": ["aarch64-apple-darwin", "1aae21fd5c70b89e0972427934a13b33886efa7f08bf428e1baee5ebd10d1753"],
  "darwin-x64": ["x86_64-apple-darwin", "bd5017621ad5b7509568d5d004a2c1d5fb8f70e7555b1abdb62f35908c0ee1b6"],
  "linux-arm64": ["aarch64-unknown-linux-musl", "ea08a64846677f36da7f2e9163c4393dd9a9dee814d13a8fb28fbe7dcbf32f6d"],
  "linux-x64": ["x86_64-unknown-linux-musl", "4955a38c2e8c99457458e2471472ccd5ee3c45bd7637a315ce33bccf0dd75d9e"],
};

function isPinnedCompiler(binary) {
  const result = spawnSync(binary, ["--version"], { encoding: "utf8" });
  return result.status === 0 && result.stdout.trim() === `gleam ${version}`;
}
