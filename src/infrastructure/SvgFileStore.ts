import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export class SvgFileStore {
  read(file: string): { path: string; content: string } {
    try {
      const path = resolve(file);
      return { path, content: readFileSync(path, "utf8") };
    } catch {
      throw new Error(`cannot read file: ${file}`);
    }
  }

  write(file: string, content: string): string {
    try {
      const path = resolve(file);
      writeFileSync(path, content, "utf8");
      return path;
    } catch {
      throw new Error(`cannot write file: ${file}`);
    }
  }
}
