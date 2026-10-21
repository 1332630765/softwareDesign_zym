/** Implementations must leave the document unchanged when any operation fails. */
export interface Command {
  execute(): string;
  undo(): string;
  redo(): string;
}
