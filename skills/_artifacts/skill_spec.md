# flame-cli Skill Spec

Skills for flame-cli, a Firestore CLI for uploading, downloading, and managing
documents. Primary audience: developers seeding test data, running one-off
Firestore operations, and building backup/restore workflows.

---

## Skill 1: getting-started

**Domain:** setup  
**Developer moment:** "I just installed flame and need to get it working in my project."

### What this skill covers

- Running `flame init` inside a Firebase project directory
- How flame discovers `.firebaserc` and `firebase.json` automatically
- Understanding `.flame.json` and what each field does
- Switching between emulator and remote with `flame use`
- Setting up ADC for remote Firestore access
- The Firebase CLI dependency: emulators must be started separately with `firebase emulators:start --only firestore`
- Checking current configuration with `flame status`
- Installing bash autocompletion with `flame install`

### Failure modes to cover

- Running `flame init` outside a Firebase project directory (no `.firebaserc` found)
- Forgetting `gcloud auth application-default login` before using remote mode
- Assuming flame starts the emulator — it does not; Firebase CLI must start it
- Calling `flame use emulator` without an emulator running

### Key facts

- `flame init` searches upward for `.firebaserc` — run it from any subdirectory of the Firebase project
- If `.flame.json` already exists, `flame init` is a no-op (reports success and exits)
- Emulator host/port are read from `firebase.json` emulators config; `.flame.json` values are fallbacks
- `flame status` is the fastest way to verify which environment you're targeting

---

## Skill 2: upload-documents

**Domain:** data-upload  
**Developer moment:** "I need to write documents to Firestore — from a file, inline JSON, or a pipe."

### What this skill covers

- Uploading a single document to a document path: `flame up users/user1 --data '{...}'`
- Uploading an array of documents to a collection with `--idField`: `flame up users --idField="id" --data '[...]'`
- Reading from stdin: `cat data.json | flame up users --idField="id"`
- Merging with existing documents: `flame up users/user1 --data '{...}' --merge`
- Piping from APIs: `curl -s https://api.example.com/data | flame up users --idField="id"`
- When `--idField` is omitted on a collection + array upload: documents get auto-generated Firestore IDs

### Path routing rule (critical)

> Even number of path segments = document path. Odd = collection path.
>
> - `users` (1 segment) → collection
> - `users/abc123` (2 segments) → document
> - `users/abc123/orders` (3 segments) → collection
> - `users/abc123/orders/order1` (4 segments) → document

### When --idField is required

| Input         | Path type       | --idField required?                    |
| ------------- | --------------- | -------------------------------------- |
| Single object | Document path   | No (ID is in the path)                 |
| Single object | Collection path | **Yes**                                |
| Array         | Collection path | Optional (omit for auto-generated IDs) |
| Array         | Document path   | Error — not supported                  |

### Failure modes to cover

- Uploading single object to collection without `--idField` → `"Must specify a document ID field with --idField!"`
- Uploading array to document path → silent error, nothing is written
- `--idField` value missing from a document in the array → `"Document N does not have ID field X!"`
- No `--data` and no stdin → `"No document data found"` error

---

## Skill 3: test-data-pipeline

**Domain:** data-upload + setup  
**Developer moment:** "I want to seed mock data into the Firestore emulator for tests."

### What this skill covers

- Full workflow: start emulator → configure flame → seed data → clean up
- Using `flame use emulator` to target the local emulator
- Seeding a collection from a JSON file in a test script
- Using `--idField` to control document IDs (critical for predictable test data)
- Using `flame delete users --force` to reset state between test runs
- Combining `down` and `up` to clone collections
- Pipeline patterns: `flame down staging/users | flame up users --idField="_id"`

### Recommended test script pattern

```bash
# Ensure emulator is targeted
flame use emulator

# Reset state
flame rm users --force

# Seed from file
cat test/fixtures/users.json | flame up users --idField="id"

# Verify
flame down users --limit 5
```

### Key facts

- The Firebase CLI must be running the emulator before flame can connect: `firebase emulators:start --only firestore`
- `flame status` shows `[emulator]` tag when targeting emulator — always verify before seeding
- `--merge` is useful for partial updates in tests without overwriting unrelated fields
- `flame delete` on a collection does NOT delete subcollections — subcollection documents remain

### Failure modes to cover

- Accidentally seeding remote Firestore instead of emulator (check `flame status` first)
- `--idField` field missing from fixture documents causes partial upload with error mid-array
- Emulator not running when `flame up` is called — connection refused error
- Running flame outside the Firebase project directory

---

## Skill 4: backup-restore

**Domain:** data-read + data-upload  
**Developer moment:** "I want to export a Firestore collection to a file and restore it later."

### What this skill covers

- Exporting a collection to JSON: `flame down users > users.json`
- Using `--docId` to include the document ID as `_id` in the output (required for restore)
- Restoring from a backup: `cat users.json | flame up users --idField="_id"`
- Limiting export size: `flame down users --limit 100`
- Cross-environment restore: exporting from remote and importing to emulator
- Piping between flame instances for collection cloning

### Backup/restore roundtrip

```bash
# Export (include --docId so the ID is preserved in JSON)
flame down users --docId > backup.json

# Restore
cat backup.json | flame up users --idField="_id"
```

### Key facts

- Without `--docId`, document IDs are not included in the JSON output — the backup cannot be restored with original IDs
- `flame down` on a collection outputs a JSON array, which `flame up` can consume directly
- Switch environments with `flame use` before each step when doing cross-environment operations
- `flame down` does not export subcollections — each subcollection must be exported separately

### Failure modes to cover

- Forgetting `--docId` on export → backup has no document IDs → restore creates new random IDs
- Restoring to wrong environment (remote instead of emulator) — always run `flame status` before restore
- Large collections: `--limit` is the only way to paginate; no cursor support

---

## Skill 5: data-management

**Domain:** data-management  
**Developer moment:** "I need to read, copy, move, or delete specific documents."

### What this skill covers

- Reading a single document: `flame down users/abc123`
- Listing all root collections: `flame collections`
- Copying a document: `flame copy users/user1 archive/user1`
- Moving a document (transactional): `flame move users/user1 archive/user1`
- Deleting a document: `flame delete users/user1`
- Deleting a collection: `flame delete users` (with confirmation)
- Using `--force` to skip confirmation in scripts
- Using `--idField` with copy/move to inject the new ID as a field

### Transactional behavior

Both `flame copy` and `flame move` run inside a Firestore transaction:

- `copy`: reads source, writes destination — source is preserved
- `move`: reads source, writes destination, deletes source — source is only deleted if the write succeeds

### Safety: confirmation prompt

`flame delete` without `--force` shows a confirmation that includes whether you are targeting **EMULATOR** or **REMOTE**. Always read this before confirming.

### Constraints

- `copy` and `move` only work on **document paths** (even segments). Collection paths throw `"Source and destination paths must be documents"`.
- `delete` on a collection removes only direct documents, not subcollections.

### Failure modes to cover

- Passing a collection path to `flame copy` or `flame move` → error, no-op
- Deleting a collection and expecting subcollections to be cleaned up — they are not
- Running `flame delete --force` in a script targeting remote Firestore
