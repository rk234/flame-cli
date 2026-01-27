import { existsSync } from "fs";
import path from "path";

export function findFileUpward(
  startDir: string,
  filename: string,
): string | undefined {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;
  while (currentDir !== root) {
    const filePath = path.join(currentDir, filename);
    if (existsSync(filePath)) {
      return filePath;
    }
    currentDir = path.dirname(currentDir);
  }
  return undefined;
}

export function findFileDirUpward(
  startDir: string,
  filename: string,
): string | undefined {
  const file = findFileUpward(startDir, filename);
  return file ? path.dirname(file) : undefined;
}
