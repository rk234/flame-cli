---
name: flame-backup-restore
description: >
  Export Firestore collections to JSON with flame down --docId and restore them
  with flame up --idField. The --docId flag embeds document IDs as _id in
  output — required for ID-preserving restores. Pipeline patterns for
  backup/restore roundtrips, cross-environment transfers (remote → emulator),
  and --limit for large collections.
type: lifecycle
library: flame-cli
library_version: "0.1.1"
requires:
  - flame-getting-started
  - flame-upload
sources:
  - "flame-cli:README.md"
  - "flame-cli:docs/commands.md"
  - "flame-cli:src/commands/down/impl.ts"
  - "flame-cli:src/commands/down/command.ts"
  - "flame-cli:src/commands/up/impl.ts"
---

This skill builds on flame-getting-started and flame-upload. Read those first
for environment setup and upload path rules.

# flame — Backup and Restore

## Setup

```bash
# Export a collection to a file (--docId preserves document IDs)
flame down users --docId > backup/users.json

# Restore from the file
cat backup/users.json | flame up users --idField="_id"
```

`--docId` embeds each document's Firestore ID as `_id` in the JSON output.
`--idField="_id"` on restore uses that value as the document ID, recreating
the original document paths.

## Core Patterns

### Full backup/restore roundtrip

```bash
# Backup
flame down users --docId > backup/users.json

# Restore (overwrites existing documents at the same IDs)
cat backup/users.json | flame up users --idField="_id"
```

### Export a single document

```bash
flame down users/user1 > backup/user1.json
```

Single-document export does not need `--docId` for restore — the document
path already contains the ID. Restore with:

```bash
flame up users/user1 --data "$(cat backup/user1.json)"
```

### Transfer a collection from remote to local emulator

```bash
# 1. Export from remote
flame use remote
flame down users --docId > /tmp/users-export.json

# 2. Import to emulator
flame use emulator
cat /tmp/users-export.json | flame up users --idField="_id"
```

Always verify the target with `flame status` before each step.

### Export a subset of a large collection

```bash
flame down users --docId --limit 500 > backup/users-sample.json
```

`--limit` caps the number of documents returned. There is no pagination cursor
— for collections larger than a manageable limit, split exports by subcollection
or document range manually.

### Pipe directly between environments (no file)

```bash
flame use remote
flame down users --docId | flame use emulator && flame up users --idField="_id"
```

Or more reliably using a temp file to avoid environment switching mid-pipe:

```bash
flame use remote && flame down users --docId > /tmp/users.json
flame use emulator && cat /tmp/users.json | flame up users --idField="_id"
```

## Common Mistakes

### CRITICAL Exporting without --docId loses document IDs

Wrong:

```bash
flame down users > backup/users.json
# Output: [{"name":"Alice"},{"name":"Bob"}]  — no IDs
cat backup/users.json | flame up users --idField="_id"
# Error: "Document 0 does not have ID field _id!"
```

Correct:

```bash
flame down users --docId > backup/users.json
# Output: [{"_id":"user1","name":"Alice"},{"_id":"user2","name":"Bob"}]
cat backup/users.json | flame up users --idField="_id"
```

Without `--docId`, document IDs are not included in the JSON output. The
backup cannot be restored with original IDs.

Source: `src/commands/down/impl.ts:49` — `formatDocument(doc, docId ?? false)`

### CRITICAL Restoring to wrong environment overwrites production data

Wrong:

```bash
# .flame.json has useEmulator: false from a previous session
cat backup/users.json | flame up users --idField="_id"   # hits remote
```

Correct:

```bash
flame status   # verify target before restore
flame use emulator
cat backup/users.json | flame up users --idField="_id"
```

`flame up` does not prompt for confirmation. Always run `flame status` before
a restore operation to confirm the target environment.

Source: `src/commands/use/impl.ts` — `useEmulator` persists across sessions.

### HIGH Restoring creates new IDs instead of preserving originals

Wrong:

```bash
# Backup was taken without --docId
flame down users > backup.json
# Restore without --idField creates random Firestore IDs
cat backup.json | flame up users
```

Correct:

```bash
flame down users --docId > backup.json
cat backup.json | flame up users --idField="_id"
```

Without `--idField`, array upload calls `collection.add()` per document,
generating new random IDs. Existing documents at the original paths are
not overwritten.

Source: `src/commands/up/impl.ts:57` — `db.collection(path).add(doc)` when no `idField`.

### MEDIUM flame down does not export subcollections

Wrong:

```bash
# Expects users and users/*/orders to both be exported
flame down users --docId > backup/users.json
```

Correct:

```bash
flame down users --docId > backup/users.json
# Export each subcollection separately
flame down users/user1/orders --docId > backup/user1-orders.json
flame down users/user2/orders --docId > backup/user2-orders.json
```

`flame down` on a collection fetches only direct documents. Subcollections
are silently omitted from the export.

Source: `src/commands/down/impl.ts:53` — `firestore.collection(path)` without
subcollection traversal.
