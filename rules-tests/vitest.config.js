import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    // Both suites share one Firestore emulator project, so run files serially.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
