import { logger } from "../../services/logger";

export default function up() {
  logger.info("Starting upload...");
  logger.success("Upload complete!");
}
