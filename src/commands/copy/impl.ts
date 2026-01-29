import type { LocalContext } from "../../context";
import { documentId, isDocumentPath } from "../../utils/firestorePath";

interface CopyFlags {
  idField?: string;
}

export default async function copy(
  this: LocalContext,
  flags: CopyFlags,
  source: string,
  destination: string,
) {
  const logger = this.logger();
  const spinner = this.spinner();

  try {
    const db = this.getFirestore();

    if (!isDocumentPath(source) || !isDocumentPath(destination)) {
      throw new Error("Source and destination paths must be documents");
    }

    const newId = documentId(destination);

    const existingDoc = await spinner.promise(db.doc(source).get(), {
      text: `Fetching source document ${source}...`,
      successText: `Fetched source document ${source}`,
    });

    if (!existingDoc.exists) {
      throw new Error(`Document ${source} does not exist!`);
    }

    await spinner.promise(
      async () => {
        if (flags.idField) {
          await db.doc(destination).set({
            ...existingDoc.data(),
            [flags.idField]: newId,
          });
        } else {
          await db.doc(destination).set(existingDoc.data() ?? {});
        }
      },
      {
        text: `Copying to destination document ${destination}...`,
        successText: `Copied to destination ${destination}`,
      },
    );
    logger.success(`Copied document ${source} to ${destination}!`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to delete: ${error.message}`);
    } else {
      logger.error("An unexpected error occurred");
    }
  }
}
