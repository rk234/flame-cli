import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { FlameConfig } from "../config/loader";
import {
  initializeApp,
  applicationDefault,
  type App,
} from "firebase-admin/app";

let app: App | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseClient(config: FlameConfig) {
  if (firestoreInstance) return firestoreInstance;
  if (config.useEmulator) {
    process.env["FIRESTORE_EMULATOR_HOST"] =
      `${config.emulatorHost}:${config.emulatorPort}`;
  }

  if (!app) {
    app = initializeApp({
      credential: applicationDefault(),
      projectId: config.project,
    });
  }

  firestoreInstance = getFirestore(app);
  // Optional: Configure Firestore settings
  firestoreInstance.settings({
    ignoreUndefinedProperties: true,
  });

  return firestoreInstance;
}
