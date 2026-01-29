import type { LocalContext } from "../../context";
import { documentId, isDocumentPath } from "../../utils/firestorePath";

interface MoveFlags {
  idField?: string;
}

export default async function move(
  this: LocalContext,
  flags: MoveFlags,
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

    await spinner.promise(
      db.runTransaction(async (transaction) => {
        const existingDoc = await transaction.get(db.doc(source));

        if (!existingDoc.exists) {
          throw new Error(`Document ${source} does not exist!`);
        }

        if (flags.idField) {
          transaction.set(db.doc(destination), {
            ...existingDoc.data(),
            [flags.idField]: newId,
          });
        } else {
          transaction.set(db.doc(destination), existingDoc.data());
        }

        transaction.delete(db.doc(source));
      }),
      {
        text: `Moving document from ${source} to ${destination}...`,
        successText: `Move successful!`,
      },
    );

    logger.success(`Copied document ${source} to ${destination}!`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to move: ${error.message}`);
    } else {
      logger.error("An unexpected error occurred");
    }
  }
}
