export interface DocumentData {
  id: string;
  data: Record<string, unknown>;
}

function docJSON(doc: DocumentData, docId: boolean) {
  let formattedDoc = doc.data;

  if (docId) {
    formattedDoc = {
      ...doc.data,
      _id: doc.id,
    };
  }

  return formattedDoc;
}

export function formatDocument(doc: DocumentData, docId: boolean): string {
  return JSON.stringify(docJSON(doc, docId), null, 2);
}

export function formatDocuments(docs: DocumentData[], docId: boolean): string {
  if (docs.length === 0) {
    return "[]";
  }
  return JSON.stringify(
    docs.map((doc) => docJSON(doc, docId)),
    null,
    2,
  );
}
