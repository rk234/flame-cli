---
name: flame-data-management
description: >
  One-off Firestore document operations: flame down to read a document or
  collection, flame copy/cp and flame move/mv for transactional document copy
  and move (document paths only), flame delete/rm with --force to skip
  confirmation, flame collections to list root collections. Copy and move
  require even-segment (document) paths — collection paths throw an error.
type: core
library: flame-cli
library_version: "0.1.1"
requires:
  - flame-getting-started
sources:
  - "flame-cli:docs/commands.md"
  - "flame-cli:src/commands/down/impl.ts"
  - "flame-cli:src/commands/copy/impl.ts"
  - "flame-cli:src/commands/move/impl.ts"
  - "flame-cli:src/commands/delete/impl.ts"
  - "flame-cli:src/commands/collections/impl.ts"
  - "flame-cli:src/utils/firestorePath.ts"
---

This skill builds on flame-getting-started. Read it first for environment setup.

# flame — Document Management

## Setup

```bash
# Read a document
flame down users/user1

# Read a collection (outputs JSON array)
flame down users

# List root collections
flame collections

# Copy a document
flame copy users/user1 archive/user1

# Move a document (transactional)
flame move users/user1 archive/user1

# Delete a document (with confirmation)
flame delete users/user1

# Delete without confirmation
flame delete users/user1 --force
```

## Core Patterns

### Read a document and pipe to jq

```bash
flame down users/user1 | jq '.role'
```

Single document output is a JSON object. Collection output is a JSON array.
Spinner and log messages are suppressed automatically when stdout is piped.

### Copy a document to a new path

```bash
# Copy users/user1 → archive/user1
flame copy users/user1 archive/user1

# Copy and inject the new document ID as a field
flame copy users/user1 archive/user1 --idField="archivedId"
```

`copy` runs inside a Firestore transaction: reads source, writes destination.
Source is preserved. If the destination write fails, no change occurs.

### Move a document (transactional)

```bash
# Move users/user1 → archive/user1 (source deleted on success)
flame move users/user1 archive/user1

# Move and inject the new ID as a field
flame move users/user1 archive/user1 --idField="newId"
```

`move` runs inside a Firestore transaction: reads source, writes destination,
deletes source — all in one operation. Source is deleted only if the
destination write succeeds. If the transaction fails, the source is preserved.

### Delete a document or collection safely

```bash
# Deletes with confirmation prompt showing EMULATOR or REMOTE target
flame delete users/user1

# Skip confirmation (use in scripts)
flame delete users --force
```

The confirmation prompt explicitly shows which environment is being targeted:
`EMULATOR` or `REMOTE`. Read it before confirming.

### List all root-level collections

```bash
flame collections
```

Outputs one collection ID per line. Only lists root collections — subcollections
are not listed.

## Common Mistakes

### CRITICAL Using flame delete --force against remote without checking

Wrong:

```bash
# Script runs flame delete --force with no environment check
flame delete users --force
```

Correct:

```bash
flame status   # verify EMULATOR vs REMOTE before deleting
flame delete users --force
```

`--force` skips the confirmation prompt that shows the EMULATOR/REMOTE target.
In scripts, always run `flame status` or `flame use emulator` explicitly before
deletion to prevent accidental remote data loss.

Source: `src/commands/delete/impl.ts:22` — force skips the env-displaying prompt.

### HIGH Passing a collection path to flame copy or flame move

Wrong:

```bash
# users is a collection path (1 segment — odd)
flame copy users archive-users
# Error: Source and destination paths must be documents
```

Correct:

```bash
# Use document paths (even segments) for copy and move
flame copy users/user1 archive/user1
```

`copy` and `move` only accept document paths. Collection-level copy/move is
not supported. To duplicate a collection, use `flame down | flame up`.

Source: `src/commands/copy/impl.ts:20` — throws if `!isDocumentPath(source)`

### HIGH flame delete on a collection leaves subcollections intact

Wrong:

```bash
# Expects users and all users/*/orders subcollections to be cleared
flame delete users --force
```

Correct:

```bash
flame delete users --force
# Subcollections must be deleted explicitly
flame delete users/user1/orders --force
flame delete users/user2/orders --force
```

`flame delete` on a collection iterates and deletes only the direct documents.
Subcollection documents remain in Firestore.

Source: `src/commands/delete/impl.ts:58` — `collectionRef.get()` without
subcollection traversal.

### MEDIUM Reading a non-existent document exits silently

Wrong:

```bash
flame down users/nonexistent
# Logs a warning and exits with code 0 — script continues
```

Correct:

```bash
# Check that output is non-empty if the script depends on the document existing
result=$(flame down users/nonexistent 2>/dev/null)
if [ -z "$result" ]; then
  echo "Document not found"
fi
```

`flame down` on a missing document logs `"Document not found: <path>"` to
stderr and exits 0. Scripts that pipe the output will receive empty stdout
without an error exit code.

Source: `src/commands/down/impl.ts:39` — `logger.warn(...)` then `return`.

### MEDIUM flame collections lists only root-level collections

Wrong:

```bash
# Expects to see users/user1/orders in the output
flame collections
```

Correct:

```bash
# List subcollections by reading a specific document path's collections
# (not supported by flame — use Firebase Admin SDK or console directly)
flame collections   # returns root collections only: users, products, etc.
```

`flame collections` calls `db.listCollections()` at the root level. It does
not traverse into document subcollections.

Source: `src/commands/collections/impl.ts:17` — `db.listCollections()`
