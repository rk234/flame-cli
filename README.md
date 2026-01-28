# 🔥 Flame

A simple, developer-friendly CLI for interacting with Firebase Firestore databases.

## Features

- **Automatic Project Detection** - Reads `.firebaserc` and `firebase.json` from your working directory
- **Emulator Support** - Easily switch between local emulator and remote Firestore
- **Pipeline-Friendly** - Suppresses informational output when piping to files or other commands
- **Shell Autocompletion** - Built-in bash completion support

## Installation

### From GitHub

```bash
npm install -g github:rk234/flame-cli
```

### From Source

```bash
# Clone the repository
git clone https://github.com/your-username/flame-cli.git
cd flame-cli

# Install dependencies and build
npm install
npm run build

# Link globally
npm link
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

# Upload a document
flame up users/user1 --data '{"name": "John", "email": "john@example.com"}'

# Download a document
flame down users/user1

# Download all documents from a collection
flame down users

# Delete a document
flame delete users/user1

# Delete all documents in a collection
flame rm users --force

# Switch to local emulator for development
flame use emulator

# Switch back to remote Firestore
flame use remote
```

## Commands

See [Commands Documentation](docs/commands.md) for detailed usage of all commands.

| Command               | Description                                        |
| --------------------- | -------------------------------------------------- |
| `flame init`          | Initialize flame for current Firebase project      |
| `flame status`        | Display flame configuration status                 |
| `flame use <target>`  | Switch between remote Firestore and local emulator |
| `flame down <path>`   | Download/display documents from Firestore          |
| `flame up <path>`     | Upload documents to Firestore                      |
| `flame delete <path>` | Delete documents or collections (alias: `rm`)      |
| `flame collections`   | List all collections                               |

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
  "useEmulator": true,
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

# Upload from file
cat backup.json | flame up users --idField="id"

# Chain download and upload (e.g., copy between collections)
flame down users | flame up users-backup --idField="_id"

# Fetch from API and upload
curl -s https://api.example.com/data | flame up imports --idField="id"
```

## Shell Autocompletion

After installation, you can optionally enable bash completion:

```bash
flame install
```

This adds autocompletion for commands, flags, and arguments. To uninstall:

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

# Or link globally for development
npm link
flame --help
```

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Tech Stack

- [Stricli](https://github.com/bloomberg/stricli) - Type-safe CLI framework
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) - Firestore client
- [Consola](https://github.com/unjs/consola) - Elegant console logging
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
