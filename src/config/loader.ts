import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "node:path";

export const CONFIG_FILE = ".flame.json";
const DEFAULT_CONF = {
  useEmulator: true,
  emulatorHost: "127.0.0.1",
  emulatorPort: 8080,
};

type FirebaseRC = {
  projects: {
    default: string;
    [alias: string]: string | undefined;
  };
};

type FirebaseJSON = {
  firestore?: {
    rules?: string;
    indexes?: string;
  };
  emulators: {
    firestore: {
      host: string;
      port: number;
    };
  };
};

export interface FlameConfig {
  useEmulator: boolean;
  project: string;
  emulatorHost: string;
  emulatorPort: number;
}

export interface FirebaseConfig {
  project: string;
  path: string;
  emulatorHost?: string;
  emulatorPort?: number;
}

let flameConfig: FlameConfig | null = null;
let configPath: string | null;
let firebaseConfig: FirebaseConfig | null = null;

export function writeConfig(dir: string, config: FlameConfig) {
  configPath = path.join(dir, CONFIG_FILE);
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function loadFirebaseConfig(cwd: string): FirebaseConfig {
  if (firebaseConfig) return firebaseConfig;
  const firebasercPath = findFileUpward(cwd, ".firebaserc");
  if (!firebasercPath)
    throw new Error(
      "No firebaserc file found! Make sure to execute this command in a firebase project directory.",
    );
  const firebasercFile = readFileSync(firebasercPath);
  const firebaseRc = JSON.parse(firebasercFile.toString()) as FirebaseRC;

  if (!firebaseRc?.projects?.default) {
    throw new Error("No default firebase project found. Run firebase init.");
  }

  const project = firebaseRc.projects.default;

  const firebaseJsonPath = findFileUpward(cwd, "firebase.json");
  if (!firebaseJsonPath) {
    throw new Error(
      "No firebase.json file found! Make sure to execute this command in a firebase project directory.",
    );
  }

  const firebaseJSONFile = readFileSync(firebaseJsonPath);
  const firebaseJSON = JSON.parse(firebaseJSONFile.toString()) as FirebaseJSON;

  firebaseConfig = {
    path: path.dirname(firebasercPath),
    project,
    emulatorHost: firebaseJSON.emulators?.firestore?.host,
    emulatorPort: firebaseJSON.emulators?.firestore?.port,
  };

  return firebaseConfig;
}

export function loadConfig(cwd: string) {
  if (flameConfig && configPath)
    return { config: flameConfig, path: configPath };

  const firebaseConf = loadFirebaseConfig(cwd);

  const existingConfigPath = findFileUpward(cwd, CONFIG_FILE);
  let config: FlameConfig = { ...DEFAULT_CONF, project: firebaseConf.project };
  if (existingConfigPath) {
    const confFile = readFileSync(existingConfigPath);
    const existingConf = JSON.parse(confFile.toString()) as FlameConfig;

    config = { ...config, ...existingConf };
  }

  if (!firebaseConf.emulatorHost && !firebaseConf.emulatorPort) {
    // no emulator
    config = {
      ...config,
      useEmulator: false,
    };
  } else {
    config = {
      ...config,
      emulatorHost: firebaseConf.emulatorHost || config.emulatorHost,
      emulatorPort: firebaseConf.emulatorPort || config.emulatorPort,
    };
  }

  flameConfig = config;
  return {
    config,
    path: existingConfigPath ?? null,
  };
}

function findFileUpward(
  startDir: string,
  filename: string,
): string | undefined {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;
  while (currentDir !== root) {
    const filePath = path.join(currentDir, filename);
    if (existsSync(filePath)) {
      return filePath;
    }
    currentDir = path.dirname(currentDir);
  }
  return undefined;
}
