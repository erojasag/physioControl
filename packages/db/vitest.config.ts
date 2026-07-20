import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    // Spike seeds shared rows; keep the file's tests sequential.
    fileParallelism: false,
  },
});
