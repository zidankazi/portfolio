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

async function ensureCompiler() {
  if (isPinnedCompiler("gleam")) return "gleam";
  const platform = `${process.platform}-${process.arch}`;
  const release = releases[platform];
  if (!release) throw new Error(`Install Gleam ${version} on ${platform} before building.`);
  const directory = join(root, "node_modules", ".cache", "gleam", version, platform);
  const binary = join(directory, "gleam");
  if (isPinnedCompiler(binary)) return binary;

  await mkdir(directory, { recursive: true });
  const temporary = await mkdtemp(join(directory, "download-"));
  try {
    const [target, checksum] = release;
    const asset = `gleam-v${version}-${target}.tar.gz`;
    console.log(`Downloading Gleam ${version} for ${platform}`);
    const response = await fetch(
      `https://github.com/gleam-lang/gleam/releases/download/v${version}/${asset}`,
      { signal: AbortSignal.timeout(60_000) },
    );
    if (!response.ok) throw new Error(`Gleam download failed: HTTP ${response.status}`);
    const archive = Buffer.from(await response.arrayBuffer());
    if (createHash("sha256").update(archive).digest("hex") !== checksum) {
      throw new Error("Gleam compiler checksum did not match the pinned release.");
    }
    const archivePath = join(temporary, asset);
    await writeFile(archivePath, archive);
    const extraction = spawnSync("tar", ["-xzf", archivePath, "-C", temporary, "gleam"], {
      stdio: "inherit",
    });
    if (extraction.status !== 0) throw new Error("Could not extract the Gleam compiler.");
    const extracted = join(temporary, "gleam");
    await chmod(extracted, 0o755);
    if (!isPinnedCompiler(extracted)) throw new Error("Downloaded compiler has an unexpected version.");
    await rename(extracted, binary);
    return binary;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

const compiler = await ensureCompiler();
const result = spawnSync(compiler, process.argv.slice(2), { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
