import Table from "cli-table3";

export type OutputFormat = "json" | "table";

export interface DocumentData {
  id: string;
  data: Record<string, unknown>;
}

/**
 * Format a single document for output
 */
export function formatDocument(
  doc: DocumentData,
  format: OutputFormat,
): string {
  if (format === "json") {
    return JSON.stringify({ id: doc.id, ...doc.data }, null, 2);
  }

  // Table format for single document - show key-value pairs
  const table = new Table({
    head: ["Field", "Value"],
    style: { head: ["cyan"] },
  });

  table.push(["id", doc.id]);

  for (const [key, value] of Object.entries(doc.data)) {
    table.push([key, formatValue(value)]);
  }

  return table.toString();
}

/**
 * Format multiple documents for output
 */
export function formatDocuments(
  docs: DocumentData[],
  format: OutputFormat,
): string {
  if (docs.length === 0) {
    return format === "json" ? "[]" : "No documents found.";
  }

  if (format === "json") {
    return JSON.stringify(
      docs.map((doc) => ({ id: doc.id, ...doc.data })),
      null,
      2,
    );
  }

  // Table format - collect all unique keys across documents
  const allKeys = new Set<string>();
  for (const doc of docs) {
    for (const key of Object.keys(doc.data)) {
      allKeys.add(key);
    }
  }

  const columns = ["id", ...Array.from(allKeys)];

  const table = new Table({
    head: columns,
    style: { head: ["cyan"] },
    wordWrap: true,
  });

  for (const doc of docs) {
    const row = columns.map((col) => {
      if (col === "id") return doc.id;
      const value = doc.data[col];
      return value !== undefined ? formatValue(value) : "";
    });
    table.push(row);
  }

  return table.toString();
}

/**
 * Format a value for table display
 */
function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "";

  if (typeof value === "object") {
    // Handle Firestore Timestamp
    if (value && typeof (value as any).toDate === "function") {
      return (value as any).toDate().toISOString();
    }
    // Handle arrays and objects
    return JSON.stringify(value);
  }

  return String(value);
}
