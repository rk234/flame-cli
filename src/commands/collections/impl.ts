import type { LocalContext } from "../../context";

export default async function use(this: LocalContext) {
  const logger = this.logger();
  const spinner = this.spinner();
  const { config } = this.tryGetConfig() ?? { config: null };

  if (!config) {
    logger.error(
      "Could not infer or load flame config. Make sure to run flame init!",
    );
    return;
  }

  const db = this.getFirestore();

  const collections = (
    await spinner.promise(db.listCollections(), {
      text: "Fetching collections...",
    })
  ).map((collection) => collection.id);

  collections.forEach((col) => this.process.stdout.write(col + "\n"));
}
