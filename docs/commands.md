# Commands

## `flame init`

Initialize flame for the current Firebase project. Creates a `.flame.json` configuration file.

```bash
flame init
```

## `flame status`

Display the current flame configuration, including project ID and emulator settings.

```bash
flame status
```

## `flame use <target>`

Switch between remote Firestore and local emulator.

```bash
# Use remote Firestore (requires ADC authentication)
flame use remote

# Use local emulator
flame use emulator
```

## `flame down <path>`

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

## `flame up <path>`

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

## `flame delete <path>` (alias: `rm`)

Delete a document or all documents in a collection. Always asks for confirmation unless `--force` is used.

```bash
# Delete a single document (with confirmation prompt)
flame delete users/user1

# Delete all documents in a collection
flame delete users

# Skip confirmation with --force
flame delete users/user1 --force
flame delete users -f

# Using the rm alias
flame rm users/user1
flame rm users -f

# Delete nested documents/collections
flame delete users/user1/orders/order1
flame rm users/user1/orders --force
```

**Options:**
| Flag | Alias | Description |
|------|-------|-------------|
| `--force` | `-f` | Skip confirmation prompt |

**Warning:** Deleting a collection will delete ALL documents within it. This operation cannot be undone.

## `flame copy <source> <destination>` (alias: `cp`)

Copy a document to a new path. Both source and destination must be document paths.

```bash
# Copy a document to a new path
flame copy users/user1 users/user2

# Copy to a different collection
flame copy users/user1 archive/user1

# Copy nested documents
flame copy users/user1/orders/order1 users/user1/orders/order2

# Add the new document ID as a field in the copied document
flame copy users/user1 users/user2 --idField="_id"

# Using the cp alias
flame cp users/user1 users/user2
```

**Options:**
| Flag | Description |
|------|-------------|
| `--idField <field>` | Add the destination document ID as a field in the copied document |

## `flame collections`

List all root-level collections in the Firestore database.

```bash
# List all collections
flame collections
```
