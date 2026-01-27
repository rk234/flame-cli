import { vi } from "vitest";
import type { FlameConfig, FirebaseConfig } from "../config/loader";

export interface MockWritable {
  write: ReturnType<typeof vi.fn>;
  getColorDepth?: () => number;
}

export interface MockProcess {
  stdout: MockWritable;
  stderr: MockWritable;
  cwd: ReturnType<typeof vi.fn>;
  exit: ReturnType<typeof vi.fn>;
  version: string;
  env: Record<string, string | undefined>;
}

export interface TestContext {
  process: MockProcess;
  stdout: string;
  stderr: string;
  os: typeof import("os");
  fs: typeof import("fs");
  path: typeof import("path");
  getConfig: () => { config: FlameConfig; path: string | null };
  tryGetConfig: () => { config: FlameConfig; path: string | null } | null;
  tryGetFirebaseConfig: () => FirebaseConfig | null;
  getFirestore: () => unknown;
}

export interface BuildTestContextOptions {
  config?: FlameConfig | null;
  configPath?: string | null;
  firebaseConfig?: FirebaseConfig | null;
  cwd?: string;
  firestoreMock?: Record<string, unknown>;
}

const DEFAULT_CONFIG: FlameConfig = {
  project: "test-project",
  useEmulator: true,
  emulatorHost: "127.0.0.1",
  emulatorPort: 8080,
};

const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  project: "test-project",
  path: "/test/firebase",
  emulatorHost: "127.0.0.1",
  emulatorPort: 8080,
};

/**
 * Builds a mock context for testing Stricli commands.
 * Captures stdout/stderr output for assertions.
 */
export function buildTestContext(
  options: BuildTestContextOptions = {},
): TestContext {
  const {
    config = DEFAULT_CONFIG,
    configPath = "/test/.flame.json",
    firebaseConfig = DEFAULT_FIREBASE_CONFIG,
    cwd = "/test/project",
    firestoreMock = {},
  } = options;

  let stdout = "";
  let stderr = "";

  const mockProcess: MockProcess = {
    stdout: {
      write: vi.fn((text: string) => {
        stdout += text;
      }),
      getColorDepth: () => 4,
    },
    stderr: {
      write: vi.fn((text: string) => {
        stderr += text;
      }),
      getColorDepth: () => 4,
    },
    cwd: vi.fn(() => cwd),
    exit: vi.fn(),
    version: "v22.0.0",
    env: {},
  };

  const context: TestContext = {
    process: mockProcess,
    os: {
      homedir: () => "/home/test",
      EOL: "\n",
    } as typeof import("os"),
    fs: {} as typeof import("fs"),
    path: {} as typeof import("path"),
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
    getConfig: () => {
      if (!config) {
        throw new Error("No config found");
      }
      return { config, path: configPath };
    },
    tryGetConfig: () => {
      if (!config) {
        return null;
      }
      return { config, path: configPath };
    },
    tryGetFirebaseConfig: () => firebaseConfig,
    getFirestore: () => {
      // Return a mock Firestore instance
      return createMockFirestore(firestoreMock) as unknown;
    },
  };

  return context;
}

/**
 * Creates a mock Firestore instance for testing.
 */
function createMockFirestore(mockData: Record<string, unknown>) {
  return {
    doc: vi.fn((path: string) => ({
      get: vi.fn(async () => {
        const data = mockData[path];
        return {
          exists: data !== undefined,
          id: path.split("/").pop(),
          data: () => data,
        };
      }),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    collection: vi.fn((path: string) => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn(function (this: unknown) {
          return this;
        }),
        get: vi.fn(async () => {
          const collectionData = mockData[path];
          if (!collectionData || !Array.isArray(collectionData)) {
            return { empty: true, docs: [] };
          }
          return {
            empty: collectionData.length === 0,
            docs: collectionData.map(
              (item: { id: string; data: Record<string, unknown> }) => ({
                id: item.id,
                data: () => item.data,
              }),
            ),
          };
        }),
      })),
      add: vi.fn(),
    })),
  };
}

/**
 * Resets all captured output in a test context.
 */
export function resetTestContext(context: TestContext): void {
  // Clear mock calls
  context.process.stdout.write.mockClear();
  context.process.stderr.write.mockClear();
}
