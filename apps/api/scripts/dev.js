#!/usr/bin/env node
// Nest reads constructor types from `emitDecoratorMetadata`, which only tsc emits.
// Runtimes that strip types (node --experimental-strip-types, esbuild) drop that
// metadata and every injected controller fails to resolve, so the dev loop compiles
// with tsc in watch mode and restarts the compiled entrypoint on each emit.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);

// Resolving the compiler entrypoint keeps this working on Windows, where spawning
// the node_modules/.bin/tsc shim needs a shell and fails with EINVAL without one.
const tscEntry = require.resolve("typescript/bin/tsc");

const children = [];

function shutdown(code) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

function run(args) {
  const child = spawn(process.execPath, args, { stdio: "inherit", cwd: apiRoot });
  child.on("error", (error) => {
    console.error(`[dev] cannot start ${args[0]}: ${error.message}`);
    shutdown(1);
  });
  child.on("exit", (code, signal) => {
    if (signal || code === 0) return;
    shutdown(code ?? 1);
  });
  children.push(child);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(0));
}

run([tscEntry, "-p", "tsconfig.build.json", "--watch", "--preserveWatchOutput"]);
run(["--watch", "--watch-preserve-output", "dist/main.js"]);
