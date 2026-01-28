import { vi } from "vitest";
import type { FlameConfig, FirebaseConfig } from "../config/loader";
import type { Spinner } from "../services/spinner";

export interface MockWritable {
  write: ReturnType<typeof vi.fn>;
  getColorDepth?: () => number;
}

export interface MockReadable {
  setEncoding: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  read: ReturnType<typeof vi.fn>;
}

export interface MockProcess {
  stdout: MockWritable;
  stderr: MockWritable;
  stdin: MockReadable;
  cwd: ReturnType<typeof vi.fn>;
  exit: ReturnType<typeof vi.fn>;
  version: string;
  env: Record<string, string | undefined>;
}

export interface MockLogger {
  log: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  success: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  prompt: ReturnType<typeof vi.fn>;
}

export interface MockSpinner {
  promise: ReturnType<typeof vi.fn>;
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
  logger: () => MockLogger;
  mockLogger: MockLogger;
  spinner: () => Spinner;
  mockSpinner: MockSpinner;
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
    stdin: {
      setEncoding: vi.fn(),
      on: vi.fn(),
      read: vi.fn(),
    },
    cwd: vi.fn(() => cwd),
    exit: vi.fn(),
    version: "v22.0.0",
    env: {},
  };

  const mockLogger: MockLogger = {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    start: vi.fn(),
    prompt: vi.fn(),
  };

  const mockSpinner: MockSpinner = {
    promise: vi.fn(async <T>(action: Promise<T> | (() => Promise<T>)) => {
      if (typeof action === "function") {
        return await action();
      }
      return await action;
    }),
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
    logger: () => mockLogger,
    mockLogger,
    spinner: () => mockSpinner as Spinner,
    mockSpinner,
  };

  return context;
}

/**
 * Creates a mock Firestore instance for testing.
 * Returns both the mock and tracking objects for assertions.
 */
export function createMockFirestore(mockData: Record<string, unknown> = {}) {
  const setCalls: Array<{ path: string; data: unknown; options?: unknown }> =
    [];
  const addCalls: Array<{ collection: string; data: unknown }> = [];

  const mockDocSet = vi.fn(async (data: unknown, options?: unknown) => {
    return {
      writeTime: {
        toDate: () => new Date(),
      },
    };
  });

  const mockCollectionAdd = vi.fn(async (data: unknown) => {
    return { id: "generated-id-" + Math.random().toString(36).slice(2, 9) };
  });

  const firestore = {
    doc: vi.fn((path: string) => {
      const docSet = vi.fn(async (data: unknown, options?: unknown) => {
        setCalls.push({ path, data, options });
        return {
          writeTime: {
            toDate: () => new Date(),
          },
        };
      });

      return {
        get: vi.fn(async () => {
          const data = mockData[path];
          return {
            exists: data !== undefined,
            id: path.split("/").pop(),
            data: () => data,
          };
        }),
        set: docSet,
        update: vi.fn(),
        delete: vi.fn(),
      };
    }),
    collection: vi.fn((collectionPath: string) => {
      const collectionAdd = vi.fn(async (data: unknown) => {
        const id = "generated-id-" + Math.random().toString(36).slice(2, 9);
        addCalls.push({ collection: collectionPath, data });
        return { id };
      });

      return {
        doc: vi.fn((docId: string) => {
          const fullPath = `${collectionPath}/${docId}`;
          const docSet = vi.fn(async (data: unknown, options?: unknown) => {
            setCalls.push({ path: fullPath, data, options });
            return {
              writeTime: {
                toDate: () => new Date(),
              },
            };
          });

          return {
            set: docSet,
            get: vi.fn(async () => {
              const data = mockData[fullPath];
              return {
                exists: data !== undefined,
                id: docId,
                data: () => data,
              };
            }),
          };
        }),
        orderBy: vi.fn(() => ({
          limit: vi.fn(function (this: unknown) {
            return this;
          }),
          get: vi.fn(async () => {
            const collectionData = mockData[collectionPath];
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
        add: collectionAdd,
      };
    }),
    _setCalls: setCalls,
    _addCalls: addCalls,
  };

  return firestore;
}

/**
 * Resets all captured output in a test context.
 */
export function resetTestContext(context: TestContext): void {
  // Clear mock calls
  context.process.stdout.write.mockClear();
  context.process.stderr.write.mockClear();
}
