---
name: flame-upload
description: >
  Upload documents to Firestore using flame up: single document to a document
  path, array of documents to a collection with --idField, stdin/pipe input,
  --data flag, --merge flag for partial updates. Path routing rule: even
  segments = document path, odd segments = collection path. --idField is
  required when uploading a single object or array to a collection path.
type: core
library: flame-cli
library_version: "0.1.1"
sources:
  - "flame-cli:docs/commands.md"
  - "flame-cli:src/commands/up/impl.ts"
  - "flame-cli:src/commands/up/command.ts"
  - "flame-cli:src/utils/firestorePath.ts"
---

# flame up — Uploading Documents

## Path Routing Rule

Even number of path segments = document path. Odd = collection path.

| Path                         | Segments | Type       |
| ---------------------------- | -------- | ---------- |
| `users`                      | 1        | collection |
| `users/abc123`               | 2        | document   |
| `users/abc123/orders`        | 3        | collection |
| `users/abc123/orders/order1` | 4        | document   |

## Setup

```bash
# Upload a single document to a document path (ID in the path)
flame up users/user1 --data '{"name": "Alice", "email": "alice@example.com"}'

# Upload an array to a collection — --idField picks the document ID from each object
echo '[{"id":"u1","name":"Alice"},{"id":"u2","name":"Bob"}]' | flame up users --idField="id"

# Upload from a file
cat users.json | flame up users --idField="id"
```

## Core Patterns

### Upload a single document to a document path

```bash
flame up users/user1 --data '{"name": "Alice", "role": "admin"}'
```

The document ID comes from the path (`user1`). `--idField` is ignored when
the path is a document path (even segments).

### Upload an array to a collection with --idField

```bash
# Each document must contain the --idField value
cat fixtures/users.json | flame up users --idField="id"
# fixtures/users.json: [{"id":"u1","name":"Alice"},{"id":"u2","name":"Bob"}]
```

`--idField` extracts the value of that field from each document and uses it
as the Firestore document ID. Every document in the array must have the field.

### Upload an array to a collection without --idField (auto-generated IDs)

```bash
cat items.json | flame up items
# items.json: [{"name":"Widget A"},{"name":"Widget B"}]
```

Omitting `--idField` when uploading an array calls `collection.add()` on each
document, generating random Firestore IDs. Use this when document IDs don't matter.

### Merge with an existing document (partial update)

```bash
flame up users/user1 --data '{"status": "active"}' --merge
```

`--merge` calls `set(data, { merge: true })`, preserving existing fields not
present in the new data. Without `--merge`, the document is overwritten.

### Upload a single object to a collection path

```bash
flame up users --idField="id" --data '{"id":"u1","name":"Alice"}'
```

When uploading a single (non-array) object to a collection path, `--idField`
is required. The value of `doc[idField]` becomes the document ID.

## Common Mistakes

### CRITICAL Uploading array to a document path silently fails

Wrong:

```bash
# users/user1 is a document path (2 segments — even)
cat '[{"id":"u1"},{"id":"u2"}]' | flame up users/user1 --idField="id"
```

Correct:

```bash
# Use a collection path (1 segment — odd) for array uploads
cat '[{"id":"u1"},{"id":"u2"}]' | flame up users --idField="id"
```

When an array is piped to a document path, `up` logs an error and writes
nothing. There is no crash — the command exits silently.

Source: `src/commands/up/impl.ts:103` — else branch logs error, no write.

### HIGH Uploading single object to collection without --idField

Wrong:

```bash
flame up users --data '{"name": "Alice"}'
# Error: Must specify a document ID field with --idField!
```

Correct:

```bash
flame up users --idField="name" --data '{"name": "Alice"}'
# or use a document path
flame up users/alice --data '{"name": "Alice"}'
```

A single (non-array) object uploaded to a collection path requires `--idField`.
Without it, the command throws before writing anything.

Source: `src/commands/up/impl.ts:91` — throws `"Must specify a document ID field with --idField!"`

### HIGH --idField value missing from a document in the array

Wrong:

```bash
# One document is missing the "id" field
cat '[{"id":"u1","name":"Alice"},{"name":"Bob"}]' | flame up users --idField="id"
# Uploads u1, then throws: "Document 1 does not have ID field id!"
```

Correct:

```bash
# Every document must contain the --idField
cat '[{"id":"u1","name":"Alice"},{"id":"u2","name":"Bob"}]' | flame up users --idField="id"
```

The array is processed sequentially. Documents before the missing field are
written; the command throws on the first missing occurrence.

Source: `src/commands/up/impl.ts:53` — throws `"Document N does not have ID field X!"`

### HIGH No --data and no stdin leaves the command hanging

Wrong:

```bash
flame up users/user1
# Hangs waiting for stdin input
```

Correct:

```bash
flame up users/user1 --data '{"name": "Alice"}'
# or pipe from stdin
echo '{"name": "Alice"}' | flame up users/user1
```

`up` reads from `--data` first, then falls back to stdin. Without either,
it blocks waiting for stdin to close.

Source: `src/commands/up/impl.ts:26` — `flags.data ?? (await readStdin(...))`

### MEDIUM --merge flag ignored on collection path single-object upload

Wrong:

```bash
# Expects --merge to apply, but the code hardcodes merge: true for this case
flame up users --idField="id" --data '{"id":"u1","status":"active"}' --merge
```

Correct:

```bash
# For collection-path single-object uploads, merge is always true regardless of --merge
# To overwrite, use a document path instead
flame up users/u1 --data '{"id":"u1","status":"active"}'
```

When uploading a single object to a collection path, the implementation calls
`set(doc, { merge: true })` unconditionally — `--merge` has no effect.

Source: `src/commands/up/impl.ts:94` — `set(docJSON, { merge: true })` hardcoded.
