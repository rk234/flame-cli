import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "node:path";

const CONFIG_FILE = ".flame.json";
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

export function writeConfig(cwd: string, config: FlameConfig) {
  writeFileSync(path.join(cwd, CONFIG_FILE), JSON.stringify(config, null, 2));
}

export function loadConfig(cwd: string) {
  const firebasercPath = findFileUpward(cwd, ".firebaserc");
  if (!firebasercPath) throw new Error("No firebaserc file found!");
  const firebasercFile = readFileSync(firebasercPath);
  const firebaseRc = JSON.parse(firebasercFile.toString()) as FirebaseRC;

  if (!firebaseRc?.projects?.default) {
    throw new Error("No default firebase project found. Run firebase init.");
  }

  const project = firebaseRc.projects.default;

  const existingConfigPath = findFileUpward(cwd, CONFIG_FILE);

  let config: FlameConfig = { ...DEFAULT_CONF, project };
  if (existingConfigPath) {
    const confFile = readFileSync(existingConfigPath);
    const existingConf = JSON.parse(confFile.toString()) as FlameConfig;

    config = { ...config, ...existingConf };
  }

  const firebaseJsonPath = findFileUpward(cwd, "firebase.json");
  if (!firebaseJsonPath) {
    throw new Error("No firebase.json file found!");
  }

  const firebaseJSONFile = readFileSync(firebaseJsonPath);
  const firebaseJSON = JSON.parse(firebaseJSONFile.toString()) as FirebaseJSON;

  if (!firebaseJSON?.emulators?.firestore) {
    // no emulator
    config = {
      ...config,
      useEmulator: false,
    };
  } else {
    const { host, port } = firebaseJSON.emulators.firestore;
    config = {
      ...config,
      emulatorHost: host || config.emulatorHost,
      emulatorPort: port || config.emulatorPort,
    };
  }

  return config;
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
