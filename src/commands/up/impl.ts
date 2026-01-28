import { oraPromise } from "ora";
import type { LocalContext } from "../../context";
import { isDocumentPath } from "../../utils/firestorePath";
import { readFullStream } from "../../utils/io";
import type { ReadStream } from "tty";

interface UpFlags {
  data?: string;
  merge?: boolean;
  idField?: string;
}

async function readStdin(stdin: ReadStream) {
  stdin.setEncoding("utf8");
  const stdinData = await readFullStream(stdin);
  const stdinString = stdinData.toString();
  return stdinString;
}

export default async function up(
  this: LocalContext,
  flags: UpFlags,
  path: string,
) {
  const logger = this.logger();
  const docString = flags.data ?? (await readStdin(this.process.stdin));
  const { merge, idField } = flags;

  if (!docString) {
    logger.error(
      "No document data found. Supply document data with --data or through stdin.",
    );
  }

  try {
    const docJSON = JSON.parse(docString);
    const db = this.getFirestore();

    // upload multiple docs
    if (Array.isArray(docJSON) && !isDocumentPath(path)) {
      for (let i = 0; i < docJSON.length; i++) {
        const doc = docJSON[i];
        const id = idField ? String(doc[idField]) : null;

        await oraPromise(
          async () => {
            if (idField) {
              if (id) {
                await db.collection(path).doc(id).set(doc, { merge: merge });
                return id;
              } else {
                throw new Error(
                  `Document ${i} does not have ID field ${idField}!`,
                );
              }
            } else {
              return (await db.collection(path).add(doc)).id;
            }
          },
          {
            text: `Writing document ${i} to ${path}${id ? `/${id}` : ""}...`,
            successText: (id) =>
              `Added document at index ${i} to ${path}/${id}`,
          },
        );
      }

      logger.info("Upload complete!");
    } else if (!Array.isArray(docJSON) && isDocumentPath(path)) {
      // upload a single doc, id already in path
      const result = await oraPromise(
        db.doc(path).set(docJSON, { merge: merge }),
        {
          text: `Adding document to ${path}`,
          successText: `Added document to ${path}`,
        },
      );

      logger.success(
        `Document ${path} written at ${result.writeTime
          .toDate()
          .toLocaleTimeString("en-us", {
            timeStyle: "full",
          })}`,
      );
    } else if (!Array.isArray(docJSON) && !isDocumentPath(path)) {
      await oraPromise(async () => {
        if (idField && docJSON[idField]) {
          const id = docJSON[idField];
          return await db
            .collection(path)
            .doc(id)
            .set(docJSON, { merge: true });
        } else {
          throw new Error("Must specify a document ID field with --idField!");
        }
      });
    } else {
      logger.error(
        "If uploading an array of documents, you must specify a document ID field with --idField and a collection path.",
      );
    }
  } catch (err) {
    logger.error("Failed to upload document");
    logger.error(err);
  }
}
