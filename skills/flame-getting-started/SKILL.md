---
name: flame-getting-started
description: >
  First-time setup for flame-cli: flame init, .flame.json config fields
  (project, useEmulator, emulatorHost, emulatorPort), switching environments
  with flame use emulator / flame use remote, ADC authentication via
  applicationDefault() for remote Firestore, Firebase CLI dependency for
  starting emulators, and flame status to verify current target.
type: lifecycle
library: flame-cli
library_version: "0.1.1"
sources:
  - "flame-cli:README.md"
  - "flame-cli:docs/commands.md"
  - "flame-cli:src/commands/init/impl.ts"
  - "flame-cli:src/commands/use/impl.ts"
  - "flame-cli:src/config/loader.ts"
  - "flame-cli:src/services/firestore.ts"
---

# flame — Getting Started

## Prerequisites

- Node.js >= 22
- A Firebase project directory containing `.firebaserc` and `firebase.json`
- For remote Firestore: Google Cloud SDK with ADC configured
- For emulator: Firebase CLI installed and emulator running

## Setup

```bash
# 1. Navigate to your Firebase project directory
cd my-firebase-project

# 2. Initialize flame — reads .firebaserc and firebase.json automatically
flame init

# 3. Verify configuration
flame status

# 4. Choose your target
flame use emulator   # local Firestore emulator
flame use remote     # remote Firestore (requires ADC)
```

`flame init` creates `.flame.json` in the Firebase project root:

```json
{
  "project": "my-firebase-project",
  "useEmulator": true,
  "emulatorHost": "127.0.0.1",
  "emulatorPort": 8080
}
```

## Core Patterns

### Start the emulator before using flame in emulator mode

```bash
# Terminal 1 — start the emulator (Firebase CLI, not flame)
firebase emulators:start --only firestore

# Terminal 2 — run flame commands
flame use emulator
flame down users
```

flame does not start the emulator. The Firebase CLI must start it separately.

### Set up ADC for remote Firestore access

```bash
gcloud auth application-default login
flame use remote
flame status   # confirms [remote] tag
```

flame always calls `applicationDefault()` internally. Without ADC configured,
all commands against remote will fail with a credentials error.

### Switch environments safely

```bash
flame use emulator   # writes useEmulator: true to .flame.json
flame status         # shows [emulator] tag — verify before writing data

flame use remote     # writes useEmulator: false to .flame.json
flame status         # shows [remote] tag — verify before writing data
```

`flame status` is the authoritative check. Always run it before destructive
operations to confirm which environment you are targeting.

### Run flame from any subdirectory of the Firebase project

```bash
# .firebaserc is at /project/.firebaserc
# flame init can be run from any subdirectory
cd /project/functions
flame init   # searches upward and finds .firebaserc
```

Config discovery walks up the directory tree — flame does not need to be run
from the project root.

## Common Mistakes

### CRITICAL Running writes against remote when emulator was intended

Wrong:

```bash
# .flame.json has useEmulator: false from a previous session
flame up users --idField="id" --data '[...]'   # hits remote Firestore
```

Correct:

```bash
flame status   # check target first
flame use emulator
flame up users --idField="id" --data '[...]'
```

`flame use emulator/remote` persists to `.flame.json`. If the last session
targeted remote, that setting carries over to the next session.

Source: `src/services/firestore.ts` — `useEmulator` flag controls
`FIRESTORE_EMULATOR_HOST` env var at client init time.

### HIGH Forgetting ADC setup before using remote mode

Wrong:

```bash
flame use remote
flame down users   # fails: "Could not load the default credentials"
```

Correct:

```bash
gcloud auth application-default login
flame use remote
flame down users
```

`applicationDefault()` is called on every flame command regardless of
emulator mode. Without ADC, remote commands fail with a credentials error.

Source: `src/services/firestore.ts:19` — `credential: applicationDefault()`

### HIGH Running flame outside a Firebase project directory

Wrong:

```bash
cd /tmp
flame down users   # Error: No firebaserc file found!
```

Correct:

```bash
cd /my-firebase-project
flame down users
```

flame searches upward for `.firebaserc` and `firebase.json`. Running outside
a Firebase project directory throws immediately.

Source: `src/config/loader.ts:54` — `findFileUpward(cwd, '.firebaserc')`

### HIGH Running flame commands before the emulator is started

Wrong:

```bash
flame use emulator
flame down users   # connection refused — emulator not running
```

Correct:

```bash
# Start emulator first (separate terminal)
firebase emulators:start --only firestore
# Then run flame
flame down users
```

flame connects to the emulator at the configured host:port. If the emulator
is not running, the Firestore client will throw a connection error.

Source: `src/services/firestore.ts:14` — sets `FIRESTORE_EMULATOR_HOST` but
does not start the emulator process.
