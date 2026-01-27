import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildTestContext, type TestContext } from "../../test/context";
import type { LocalContext } from "../../context";
import init from "./impl";

// Helper to cast test context to LocalContext for testing
const asContext = (ctx: TestContext) => ctx as unknown as LocalContext;

// Mock the logger
vi.mock("../../services/logger", () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    start: vi.fn(),
    prompt: vi.fn(),
  },
}));

// Mock the config writer
vi.mock("../../config/loader", () => ({
  CONFIG_FILE: ".flame.json",
  writeConfig: vi.fn(),
}));

import { logger } from "../../services/logger";
import { writeConfig } from "../../config/loader";

describe("init command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows success message when config file already exists", async () => {
    const context = buildTestContext({
      config: {
        project: "existing-project",
        useEmulator: true,
        emulatorHost: "127.0.0.1",
        emulatorPort: 8080,
      },
      configPath: "/test/project/.flame.json",
    });

    await init.call(asContext(context));

    // Should show success that config already exists
    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining("already exists"),
    );
    // Should not write a new config
    expect(writeConfig).not.toHaveBeenCalled();
  });

  it("writes inferred config when no config file exists but firebase project is detected", async () => {
    const context = buildTestContext({
      config: {
        project: "inferred-project",
        useEmulator: false,
        emulatorHost: "127.0.0.1",
        emulatorPort: 8080,
      },
      configPath: null, // No existing flame config
      firebaseConfig: {
        project: "inferred-project",
        path: "/test/firebase",
      },
    });

    await init.call(asContext(context));

    // Should log that config was inferred
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("inferred"),
    );
    // Should write the config
    expect(writeConfig).toHaveBeenCalled();
    // Should show success
    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining("successfully created"),
    );
  });

  it("starts initialization process with a start message", async () => {
    const context = buildTestContext({
      config: {
        project: "test",
        useEmulator: true,
        emulatorHost: "127.0.0.1",
        emulatorPort: 8080,
      },
      configPath: "/exists/.flame.json",
    });

    await init.call(asContext(context));

    expect(logger.start).toHaveBeenCalledWith(
      expect.stringContaining("Initializing"),
    );
  });

  it("warns when no firebase project can be inferred and config is null", async () => {
    const context = buildTestContext({
      config: null,
      configPath: null,
      firebaseConfig: null,
    });

    await init.call(asContext(context));

    // Should warn about not being able to infer config
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Could not infer config"),
    );
  });
});
