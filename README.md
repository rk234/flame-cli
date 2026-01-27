# 🔥 Flame

A simple, developer-friendly CLI for interacting with Firebase Firestore databases.

## Features

- **Automatic Project Detection** - Reads `.firebaserc` and `firebase.json` from your working directory
- **Emulator Support** - Easily switch between local emulator and remote Firestore
- **Pipeline-Friendly** - Suppresses informational output when piping to files or other commands
- **Shell Autocompletion** - Built-in bash completion support

## Installation

```bash
npm install -g flame-cli
```

**Requirements:** Node.js >= 22

## Quick Start

```bash
# Navigate to your Firebase project directory
cd my-firebase-project

# Initialize flame (creates .flame.json)
flame init

# Check configuration status
flame status

# Download documents from a collection
flame down users

# Download a specific document
flame down users/abc123

# Switch to local emulator
flame use emulator

# Switch back to remote Firestore
flame use remote
```

## Commands

### `flame init`

Initialize flame for the current Firebase project. Creates a `.flame.json` configuration file.

```bash
flame init
```

### `flame status`

Display the current flame configuration, including project ID and emulator settings.

```bash
flame status
```

### `flame use <target>`

Switch between remote Firestore and local emulator.

```bash
# Use remote Firestore (requires ADC authentication)
flame use remote

# Use local emulator
flame use emulator
```

### `flame down <path>`

Download and display documents from Firestore.

```bash
# Download all documents from a collection
flame down users

# Download a specific document
flame down users/abc123

# Limit results
flame down users --limit 10
flame down users -l 10

# Output as JSON (default, pipe-friendly)
flame down users > users.json

# Nested collections
flame down users/abc123/orders
```

**Options:**
| Flag | Alias | Description |
|------|-------|-------------|
| `--limit <n>` | `-l` | Maximum number of documents to return |

### `flame up` (Coming Soon)

Upload documents to Firestore from JSON input.

## Configuration

Flame uses three configuration sources:

| File            | Purpose                                                     |
| --------------- | ----------------------------------------------------------- |
| `.firebaserc`   | Firebase project aliases (read-only)                        |
| `firebase.json` | Firebase configuration including emulator ports (read-only) |
| `.flame.json`   | Flame-specific settings (created by `flame init`)           |

### `.flame.json` Structure

```json
{
  "project": "my-firebase-project",
  "useEmulator": false,
  "emulatorHost": "127.0.0.1",
  "emulatorPort": 8080
}
```

## Authentication

### Remote Firestore

Flame uses [Application Default Credentials (ADC)](https://cloud.google.com/docs/authentication/application-default-credentials) for authentication. Set up ADC using:

```bash
gcloud auth application-default login
```

### Local Emulator

No authentication required. Ensure your Firebase emulator is running:

```bash
firebase emulators:start --only firestore
```

Then switch flame to emulator mode:

```bash
flame use emulator
```

## Pipeline Usage

Flame automatically detects when output is being piped and suppresses informational messages, outputting only raw JSON data:

```bash
# Pipe to jq for processing
flame down users | jq '.[].email'

# Save to file
flame down users > backup.json

# Pipe to other commands
flame down users | grep "active"
```

## Shell Autocompletion

Install bash completion:

```bash
flame install
```

Uninstall:

```bash
flame uninstall
```

## Development

```bash
# Clone the repository
git clone https://github.com/your-username/flame-cli.git
cd flame-cli

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/cli.js --help
```

## Tech Stack

- [Stricli](https://github.com/bloomberg/stricli) - Type-safe CLI framework
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) - Firestore client
- [Consola](https://github.com/unjs/consola) - Elegant console logging
- [Chalk](https://github.com/chalk/chalk) - Terminal styling

## License

MIT
