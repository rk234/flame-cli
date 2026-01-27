import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildTestContext, type TestContext } from "../../test/context";
import type { LocalContext } from "../../context";
import status from "./impl";

// Helper to cast test context to LocalContext for testing
const asContext = (ctx: TestContext) => ctx as unknown as LocalContext;

// Mock the logger to capture log calls
vi.mock("../../services/logger", () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Need to import after mock
import { logger } from "../../services/logger";

describe("status command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays flame version and node version", () => {
    const context = buildTestContext();

    status.call(asContext(context));

    // Check that logger.log was called (for version header)
    expect(logger.log).toHaveBeenCalled();
    // Check that node version was logged
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("v22.0.0"),
    );
  });

  it("displays config information when config exists", () => {
    const context = buildTestContext({
      config: {
        project: "my-project",
        useEmulator: true,
        emulatorHost: "localhost",
        emulatorPort: 9000,
      },
      configPath: "/path/to/.flame.json",
    });

    status.call(asContext(context));

    // Verify project info was logged
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("my-project"),
    );
    // Verify emulator status was logged
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Yes"));
    // Verify emulator host/port was logged
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("localhost:9000"),
    );
    // Verify config path was logged
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("/path/to/.flame.json"),
    );
  });

  it("displays emulator as No when useEmulator is false", () => {
    const context = buildTestContext({
      config: {
        project: "prod-project",
        useEmulator: false,
        emulatorHost: "127.0.0.1",
        emulatorPort: 8080,
      },
    });

    status.call(asContext(context));

    // Verify emulator status shows "No"
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("No"));
  });

  it("warns when no config is found", () => {
    const context = buildTestContext({
      config: null,
      configPath: null,
    });

    status.call(asContext(context));

    // Verify warning was shown
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("No flame config file found"),
    );
  });
});
