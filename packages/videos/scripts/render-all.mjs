#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesRoot = join(__dirname, "..");
const outputDir = join(packagesRoot, "..", "..", "apps", "web", "public", "videos");

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

// Video configurations
const videos = [
  {
    id: "HeroAnimation",
    outputName: "hero-animation",
    formats: ["mp4", "webm"],
  },
  {
    id: "SpeakAnimation",
    outputName: "step-speak",
    formats: ["mp4", "webm"],
  },
  {
    id: "AIExtractsAnimation",
    outputName: "step-ai-extracts",
    formats: ["mp4", "webm"],
  },
  {
    id: "PatternsAnimation",
    outputName: "step-patterns",
    formats: ["mp4", "webm"],
  },
];

// Codec configurations
const codecConfig = {
  mp4: {
    codec: "h264",
    extension: "mp4",
  },
  webm: {
    codec: "vp8",
    extension: "webm",
  },
};

console.log("Starting video rendering...\n");

let successCount = 0;
let failCount = 0;

for (const video of videos) {
  for (const format of video.formats) {
    const config = codecConfig[format];
    const outputPath = join(outputDir, `${video.outputName}.${config.extension}`);

    console.log(`Rendering ${video.id} as ${format}...`);

    try {
      const command = [
        "npx remotion render",
        `"${video.id}"`,
        `"${outputPath}"`,
        `--codec=${config.codec}`,
        "--log=error",
      ].join(" ");

      execSync(command, {
        cwd: packagesRoot,
        stdio: "inherit",
      });

      console.log(`  Done: ${outputPath}\n`);
      successCount++;
    } catch (error) {
      console.error(`  Failed to render ${video.id} as ${format}`);
      console.error(`  Error: ${error.message}\n`);
      failCount++;
    }
  }
}

console.log("\n========================================");
console.log(`Rendering complete!`);
console.log(`  Success: ${successCount}`);
console.log(`  Failed: ${failCount}`);
console.log(`  Output directory: ${outputDir}`);
console.log("========================================\n");

if (failCount > 0) {
  process.exit(1);
}
