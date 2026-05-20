#!/usr/bin/env bun
import { spawnSync } from "node:child_process";

function inGitRepository(): boolean {
  const result = spawnSync("git", ["rev-parse", "--git-dir"], {
    stdio: "ignore",
  });
  return result.status === 0;
}

if (!inGitRepository()) {
  console.log("[prepare] Skipping git hook setup: not in a git repository");
  process.exit(0);
}

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
