import type { LocalContext } from "../../context";
import { logger } from "../../services/logger";
import {
  formatDocument,
  formatDocuments,
  type OutputFormat,
  type DocumentData,
} from "../../services/formatter";

interface DownFlags {
  format: OutputFormat;
  limit?: number;
}

/**
 * Determines if a path points to a document (even segments) or collection (odd segments)
 */
function isDocumentPath(path: string): boolean {
  const segments = path.split("/").filter(Boolean);
  return segments.length % 2 === 0;
}

export default async function down(
  this: LocalContext,
  flags: DownFlags,
  path: string,
) {
  const { format } = flags;
  const firestore = this.getFirestore();

  try {
    if (isDocumentPath(path)) {
      // Fetch single document
      const docRef = firestore.doc(path);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        logger.warn(`Document not found: ${path}`);
        return;
      }

      const doc: DocumentData = {
        id: docSnap.id,
        data: docSnap.data() ?? {},
      };

      const output = formatDocument(doc, format);
      this.process.stdout.write(output + "\n");
    } else {
      // Fetch collection
      const collectionRef = firestore.collection(path);
      let query = collectionRef.orderBy("__name__");

      if (flags.limit) {
        query = query.limit(flags.limit);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        logger.warn(`No documents found in collection: ${path}`);
        return;
      }

      const docs: DocumentData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));

      logger.info(`Found ${docs.length} document(s) in ${path}`);
      const output = formatDocuments(docs, format);
      this.process.stdout.write(output + "\n");
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to fetch: ${error.message}`);
    } else {
      logger.error("An unexpected error occurred");
    }
  }
}
