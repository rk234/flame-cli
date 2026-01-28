/**
 * Determines if a path points to a document (even segments) or collection (odd segments)
 */
export function isDocumentPath(path: string): boolean {
  const segments = path.split("/").filter(Boolean);
  return segments.length % 2 === 0;
}

export function documentId(path: string): string | null {
  if (isDocumentPath(path)) {
    const segments = path.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? null;
  } else {
    return null;
  }
}
