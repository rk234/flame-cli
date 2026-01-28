# 🔥 Flame

A simple, developer-friendly CLI for interacting with Firebase Firestore databases.

## Features

- **Automatic Project Detection** - Reads `.firebaserc` and `firebase.json` from your working directory
- **Emulator Support** - Easily switch between local emulator and remote Firestore
- **Pipeline-Friendly** - Suppresses informational output when piping to files or other commands
- **Shell Autocompletion** - Built-in bash completion support

## Installation

### From npm

```bash
npm install -g flame-cli
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

# Upload multiple documents from an API
curl -s https://jsonplaceholder.typicode.com/users | flame up users --idField="id"

# Switch to local emulator for development
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

### `flame up <path>`

Upload documents to Firestore from JSON input (via `--data` flag or stdin).

```bash
# Upload a single document to a specific path
flame up users/user1 --data '{"name": "John", "email": "john@example.com"}'

# Upload from stdin
echo '{"name": "Jane"}' | flame up users/user2

# Upload multiple documents to a collection (requires --idField)
flame up users --idField="_id" --data '[{"_id": "u1", "name": "Alice"}, {"_id": "u2", "name": "Bob"}]'

# Pipe from a file
cat users.json | flame up users --idField="id"

# Pipe from an API
curl -s https://jsonplaceholder.typicode.com/users | flame up users --idField="id"

# Merge with existing document data
flame up users/user1 --data '{"status": "active"}' --merge
```

**Options:**
| Flag | Description |
|------|-------------|
| `--data <json>` | JSON document data to upload (alternative to stdin) |
| `--idField <field>` | Field to use as document ID when uploading to a collection |
| `--merge` | Merge with existing document instead of overwriting |

**Path Types:**

- **Document path** (even segments, e.g., `users/user1`): Uploads a single document
- **Collection path** (odd segments, e.g., `users`): Requires `--idField` for single docs, or an array of documents

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

# Upload from file
cat backup.json | flame up users --idField="id"

# Chain download and upload (e.g., copy between projects)
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

## License

MIT
