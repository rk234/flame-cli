import type { LocalContext } from "../../context";
import { isDocumentPath } from "../../utils/firestorePath";
import chalk from "chalk";

interface DeleteFlags {
  force?: boolean;
}

export default async function del(
  this: LocalContext,
  flags: DeleteFlags,
  path: string,
) {
  const logger = this.logger();
  const spinner = this.spinner();

  try {
    const firestore = this.getFirestore();
    const { config } = this.getConfig();
    const isDocument = isDocumentPath(path);

    if (!flags.force) {
      const targetType = isDocument ? "document" : "collection";
      const confirmed = await logger.prompt(
        `Are you sure you want to delete the ${targetType} at ${chalk.bold(path)}? You are currently targeting the ${chalk.bold.blueBright(config.useEmulator ? "EMULATOR" : "REMOTE")}.`,
        {
          type: "confirm",
          initial: false,
        },
      );

      if (!confirmed) {
        logger.info("Deletion cancelled.");
        return;
      }
    }

    if (isDocument) {
      //document
      const docRef = firestore.doc(path);
      const docSnap = await spinner.promise(docRef.get(), {
        text: "Checking document...",
      });

      if (!docSnap.exists) {
        logger.warn(`Document not found: ${path}`);
        return;
      }

      await spinner.promise(docRef.delete(), {
        text: `Deleting document ${path}...`,
        successText: `Deleted document ${path}`,
      });

      logger.success(`Document ${path} deleted successfully.`);
    } else {
      //collection
      const collectionRef = firestore.collection(path);
      const snapshot = await spinner.promise(collectionRef.get(), {
        text: "Fetching collection documents...",
      });

      if (snapshot.empty) {
        logger.warn(`No documents found in collection: ${path}`);
        return;
      }

      const totalDocs = snapshot.docs.length;
      let deletedCount = 0;

      for (const doc of snapshot.docs) {
        await spinner.promise(doc.ref.delete(), {
          text: `Deleting document ${deletedCount + 1}/${totalDocs}...`,
          successText: `Deleted ${doc.id}`,
        });
        deletedCount++;
      }

      logger.success(
        `Deleted ${deletedCount} document(s) from collection ${path}.`,
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to delete: ${error.message}`);
    } else {
      logger.error("An unexpected error occurred");
    }
  }
}
