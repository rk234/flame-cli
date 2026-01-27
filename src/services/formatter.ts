export interface DocumentData {
  id: string;
  data: Record<string, unknown>;
}

export function formatDocument(doc: DocumentData): string {
  return JSON.stringify({ _id: doc.id, ...doc.data }, null, 2);
}

export function formatDocuments(docs: DocumentData[]): string {
  if (docs.length === 0) {
    return "[]";
  }
  return JSON.stringify(
    docs.map((doc) => ({ _id: doc.id, ...doc.data })),
    null,
    2,
  );
}
