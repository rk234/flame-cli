---
name: flame-test-data
description: >
  Seed mock data into the Firestore emulator for development and test scripts:
  full start-emulator → flame use emulator → flame up → flame delete workflow,
  fixture file patterns with --idField for predictable document IDs, resetting
  collection state between test runs with flame delete --force, and combining
  flame up / flame down / flame delete in automated scripts.
type: lifecycle
library: flame-cli
library_version: "0.1.1"
requires:
  - flame-getting-started
  - flame-upload
sources:
  - "flame-cli:README.md"
  - "flame-cli:docs/commands.md"
  - "flame-cli:src/commands/up/impl.ts"
  - "flame-cli:src/commands/delete/impl.ts"
---

This skill builds on flame-getting-started and flame-upload. Read those first
for environment setup and upload path rules.

# flame — Test Data Pipeline

## Setup

```bash
# 1. Start the Firestore emulator (Firebase CLI — separate terminal)
firebase emulators:start --only firestore

# 2. Target the emulator
flame use emulator

# 3. Verify
flame status   # should show [emulator] tag
```

## Core Patterns

### Seed a collection from a fixture file

```json
// test/fixtures/users.json
[
  { "id": "user1", "name": "Alice", "role": "admin" },
  { "id": "user2", "name": "Bob", "role": "viewer" }
]
```

```bash
cat test/fixtures/users.json | flame up users --idField="id"
```

Using `--idField` gives documents predictable IDs, making test assertions
against specific document paths reliable.

### Reset collection state between test runs

```bash
flame delete users --force   # deletes all documents without confirmation
cat test/fixtures/users.json | flame up users --idField="id"
```

`--force` skips the confirmation prompt, making this safe to use in scripts.
Without `--force`, the command prompts interactively and blocks the script.

### Full seed script

```bash
#!/bin/bash
set -e

# Verify emulator is targeted
flame status

# Reset collections
flame delete users --force
flame delete products --force

# Seed
cat test/fixtures/users.json    | flame up users    --idField="id"
cat test/fixtures/products.json | flame up products --idField="id"

echo "Seed complete"
```

### Clone a collection from staging to local emulator

```bash
# Export from remote staging
flame use remote
flame down staging-users --docId > /tmp/staging-users.json

# Import to local emulator
flame use emulator
cat /tmp/staging-users.json | flame up users --idField="_id"
```

`--docId` embeds the original document ID as `_id` in each exported object,
which `--idField="_id"` then uses to recreate the same IDs locally.

### Partially update test documents (merge)

```bash
# Set only the status field without overwriting other fields
flame up users/user1 --data '{"status": "suspended"}' --merge
```

## Common Mistakes

### CRITICAL Seeding remote Firestore instead of the emulator

Wrong:

```bash
# .flame.json still has useEmulator: false from a previous session
cat fixtures/users.json | flame up users --idField="id"   # hits remote
```

Correct:

```bash
flame status   # check first
flame use emulator
cat fixtures/users.json | flame up users --idField="id"
```

`flame use emulator/remote` persists to `.flame.json`. Always run
`flame status` at the top of a seed script to confirm the target.

Source: `src/services/firestore.ts:14` — emulator mode set at client init.

### HIGH Fixture file missing --idField values causes partial seed

Wrong:

```json
// fixtures/users.json — one document is missing "id"
[{ "id": "u1", "name": "Alice" }, { "name": "Bob" }]
```

```bash
cat fixtures/users.json | flame up users --idField="id"
# Writes u1, then throws: "Document 1 does not have ID field id!"
```

Correct:

```json
[
  { "id": "u1", "name": "Alice" },
  { "id": "u2", "name": "Bob" }
]
```

The array is uploaded sequentially. Documents before the missing field are
written; the command throws and halts on the first missing occurrence,
leaving the collection in a partially-seeded state.

Source: `src/commands/up/impl.ts:53`

### HIGH Using flame delete without --force blocks scripts

Wrong:

```bash
# Hangs waiting for interactive confirmation
flame delete users
cat fixtures/users.json | flame up users --idField="id"
```

Correct:

```bash
flame delete users --force
cat fixtures/users.json | flame up users --idField="id"
```

Without `--force`, `flame delete` prompts for confirmation via stdin. In a
non-interactive script this blocks indefinitely.

Source: `src/commands/delete/impl.ts:22` — prompts unless `flags.force` is set.

### MEDIUM flame delete does not remove subcollections

Wrong:

```bash
# Expects users and users/*/orders to both be cleared
flame delete users --force
```

Correct:

```bash
# Delete each subcollection explicitly
flame delete users --force
flame delete users/user1/orders --force
flame delete users/user2/orders --force
```

`flame delete` on a collection removes only the direct documents in that
collection. Subcollection documents remain in Firestore.

Source: `src/commands/delete/impl.ts:58` — iterates `collectionRef.get()`,
no recursive subcollection traversal.
