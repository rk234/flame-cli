import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildTestContext, type TestContext } from "../../test/context";
import type { LocalContext } from "../../context";
import use from "./impl";

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
  },
}));

// Mock the config writer
vi.mock("../../config/loader", () => ({
  writeConfig: vi.fn(),
}));

import { logger } from "../../services/logger";
import { writeConfig } from "../../config/loader";

describe("use command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("switches to emulator mode", () => {
    const context = buildTestContext({
      config: {
        project: "test-project",
        useEmulator: false,
        emulatorHost: "127.0.0.1",
        emulatorPort: 8080,
      },
      configPath: "/test/firebase/.flame.json",
    });

    use.call(asContext(context), {}, "emulator");

    // Verify config was written with useEmulator: true
    expect(writeConfig).toHaveBeenCalledWith(
      "/test/firebase",
      expect.objectContaining({ useEmulator: true }),
    );
    // Verify success message
    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining("emulator"),
    );
  });

  it("switches to remote mode", () => {
    const context = buildTestContext({
      config: {
        project: "prod-project",
        useEmulator: true,
        emulatorHost: "127.0.0.1",
        emulatorPort: 8080,
      },
      configPath: "/test/firebase/.flame.json",
    });

    use.call(asContext(context), {}, "remote");

    // Verify config was written with useEmulator: false
    expect(writeConfig).toHaveBeenCalledWith(
      "/test/firebase",
      expect.objectContaining({ useEmulator: false }),
    );
    // Verify success message mentions remote
    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining("remote"),
    );
  });

  it("shows error when no config is found", () => {
    const context = buildTestContext({
      config: null,
      configPath: null,
    });

    use.call(asContext(context), {}, "emulator");

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Could not infer or load flame config"),
    );
    // Verify config was not written
    expect(writeConfig).not.toHaveBeenCalled();
  });

  it("shows error when config path is null", () => {
    const context = buildTestContext({
      config: {
        project: "test-project",
        useEmulator: false,
        emulatorHost: "127.0.0.1",
        emulatorPort: 8080,
      },
      configPath: null,
    });

    use.call(asContext(context), {}, "emulator");

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("No config file found"),
    );
    // Verify config was not written
    expect(writeConfig).not.toHaveBeenCalled();
  });

  it("includes emulator host and port in success message when switching to emulator", () => {
    const context = buildTestContext({
      config: {
        project: "test-project",
        useEmulator: false,
        emulatorHost: "localhost",
        emulatorPort: 9000,
      },
      configPath: "/test/firebase/.flame.json",
    });

    use.call(asContext(context), {}, "emulator");

    // Verify success message includes host:port
    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining("localhost:9000"),
    );
  });

  it("includes project name in success message when switching to remote", () => {
    const context = buildTestContext({
      config: {
        project: "my-awesome-project",
        useEmulator: true,
        emulatorHost: "127.0.0.1",
        emulatorPort: 8080,
      },
      configPath: "/test/firebase/.flame.json",
    });

    use.call(asContext(context), {}, "remote");

    // Verify success message includes project name
    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining("my-awesome-project"),
    );
  });
});
