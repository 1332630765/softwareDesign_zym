import { Command } from "./Command.js";
import { SvgDocument } from "../domain/SvgDocument.js";

export class SnapshotCommand implements Command {
  private before?: SvgDocument;
  private after?: SvgDocument;

  constructor(
    private readonly document: SvgDocument,
    private readonly action: () => string,
    private readonly undoMessage: string,
    private readonly redoMessage: string
  ) {}

  execute(): string {
    this.before = this.document.snapshot();
    try {
      const result = this.action();
      this.after = this.document.snapshot();
      return result;
    } catch (error) {
      try {
        this.document.restore(this.before);
      } catch (restoreError) {
        throw new AggregateError([error, restoreError], "edit failed and rollback failed");
      }
      throw error;
    }
  }

  undo(): string {
    if (!this.before) throw new Error("command has not been executed");
    this.document.restore(this.before);
    return this.undoMessage;
  }

  redo(): string {
    if (!this.after) throw new Error("command has not been executed");
    this.document.restore(this.after);
    return this.redoMessage;
  }
}
