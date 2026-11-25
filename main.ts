// SPDX-License-Identifier: MIT
// Entry for make.fun news-image-20261124: "The World in One Day".
// The front page (entry.png, 1024x1024) was drawn in code during the
// build session and ships beside this file. This program validates it
// and copies it, unchanged, into the grader's output directory, so
// every run produces byte-identical output.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1048576; // 1 MiB
const MAX_SIDE = 1024;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const targetPath = join(outDir, "entry.png");

function fail(message: string): never {
  throw new Error(`entry.png rejected: ${message}`);
}

const png = readFileSync(sourcePath);

if (png.length < 8 || !png.subarray(0, 8).equals(PNG_SIGNATURE)) {
  fail("not a PNG file");
}
if (png.length < 33 || png.subarray(12, 16).toString("latin1") !== "IHDR") {
  fail("missing IHDR chunk");
}
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width !== MAX_SIDE || height !== MAX_SIDE) {
  fail(`dimensions ${width}x${height} must be exactly ${MAX_SIDE}x${MAX_SIDE}`);
}
if (png.length < 12 || png.subarray(-8, -4).toString("latin1") !== "IEND") {
  fail("missing trailing IEND chunk");
}
if (png.length > MAX_BYTES) {
  fail(`${png.length} bytes exceeds the 1 MiB limit`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(sourcePath, targetPath);

const copied = readFileSync(targetPath);
const digest = (b: Buffer) => createHash("sha256").update(b).digest("hex");
if (digest(copied) !== digest(png)) {
  fail("copied file does not match the shipped entry.png");
}
console.log(`wrote ${targetPath} (${copied.length} bytes, ${width}x${height}, sha256 ${digest(copied)})`);
