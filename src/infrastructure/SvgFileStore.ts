import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";

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
    const path = resolve(file);
    const temporary = join(dirname(path), `.svg-editor-${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, content, { encoding: "utf8", flag: "wx" });
      renameSync(temporary, path);
      return path;
    } catch {
      try { unlinkSync(temporary); } catch { /* No temporary file was created, or cleanup failed. */ }
      throw new Error(`cannot write file: ${file}`);
    }
  }
}
