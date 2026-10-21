import { Command } from "./Command.js";

export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private ioLocked = false;

  execute(command: Command): string {
    const result = command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
    this.ioLocked = false;
    return result;
  }

  undo(): string {
    if (this.ioLocked) throw new Error("undo not allowed after io command");
    const command = this.undoStack.at(-1);
    if (!command) throw new Error("nothing to undo");
    const result = command.undo();
    this.undoStack.pop();
    this.redoStack.push(command);
    return result;
  }

  redo(): string {
    if (this.ioLocked) throw new Error("undo not allowed after io command");
    const command = this.redoStack.at(-1);
    if (!command) throw new Error("nothing to redo");
    const result = command.redo();
    this.redoStack.pop();
    this.undoStack.push(command);
    return result;
  }

  afterIo(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.ioLocked = true;
  }
}
