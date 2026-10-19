import { SvgEditor } from "../application/SvgEditor.js";
import { Tokenizer } from "./Tokenizer.js";

export class CommandDispatcher {
  constructor(private readonly editor: SvgEditor, private readonly tokenizer = new Tokenizer()) {}

  dispatch(line: string): string {
    const input = line.trim();
    if (!input || input.startsWith("#")) return "";
    const [name, ...args] = this.tokenizer.tokenize(input);
    switch (name) {
      case "init":
        this.requireArity(args, 0, 2, "init [w] [h]");
        return this.editor.init(this.number(args[0], 800), this.number(args[1], 600));
      case "canvas":
        this.requireArity(args, 0, 2, "canvas [w] [h]");
        if (args.length === 1) throw new Error("usage: canvas [w] [h]");
        return args.length === 0 ? this.editor.canvas() : this.editor.canvas(this.number(args[0]), this.number(args[1]));
      case "create":
        this.requireArity(args, 2, Number.MAX_SAFE_INTEGER, "create <type> <id> [params] [in <containerId>]");
        return this.create(args);
      case "delete":
        this.requireArity(args, 1, 1, "delete <id>");
        return this.editor.delete(args[0]);
      case "move":
        this.requireArity(args, 3, 3, "move <id> <dx> <dy>");
        return this.editor.move(args[0], this.number(args[1]), this.number(args[2]));
      case "scale":
        this.requireArity(args, 2, 2, "scale <id> <factor>");
        return this.editor.scale(args[0], this.number(args[1]));
      case "set":
        this.requireArity(args, 3, 3, "set <id> <attr> <value>");
        return this.editor.set(args[0], args[1], args[2]);
      case "group":
        this.requireArity(args, 2, Number.MAX_SAFE_INTEGER, "group <newGid> <id1> <id2> ...");
        return this.editor.group(args[0], args.slice(1));
      case "ungroup":
        this.requireArity(args, 1, 1, "ungroup <gid>");
        return this.editor.ungroup(args[0]);
      case "addto":
        this.requireArity(args, 2, 2, "addto <gid> <id>");
        return this.editor.addTo(args[0], args[1]);
      case "front":
        this.requireArity(args, 1, 1, "front <id>");
        return this.editor.reorder(args[0], true);
      case "back":
        this.requireArity(args, 1, 1, "back <id>");
        return this.editor.reorder(args[0], false);
      case "tree":
        this.requireArity(args, 0, 1, "tree [id]");
        return this.editor.tree(args[0]);
      case "show":
        this.requireArity(args, 1, 1, "show <id>");
        return this.editor.show(args[0]);
      case "undo":
        this.requireArity(args, 0, 0, "undo");
        return this.editor.undo();
      case "redo":
        this.requireArity(args, 0, 0, "redo");
        return this.editor.redo();
      case "help":
        this.requireArity(args, 0, 0, "help");
        return [
          "Commands:",
          "  init [w] [h] | canvas [w] [h]",
          "  create <type> <id> [params] [in <gid>] | delete <id>",
          "  move <id> <dx> <dy> | scale <id> <factor> | set <id> <attr> <value>",
          "  group <gid> <id...> | ungroup <gid> | addto <gid> <id>",
          "  front <id> | back <id> | tree [id] | show <id> | undo | redo | help"
        ].join("\n");
      default:
        throw new Error(`unknown command: ${name}`);
    }
  }

  private create(args: string[]): string {
    const marker = args.lastIndexOf("in");
    let containerId: string | undefined;
    if (marker >= 2) {
      if (marker !== args.length - 2) throw new Error("'in' must be followed by one container id");
      containerId = args[marker + 1];
      args = args.slice(0, marker);
    }
    return this.editor.create(args[0], args[1], args.slice(2), containerId);
  }

  private number(value: string | undefined, fallback?: number): number {
    if (value === undefined && fallback !== undefined) return fallback;
    const number = Number(value);
    if (value === undefined || !Number.isFinite(number)) throw new Error(`invalid number: ${value}`);
    return number;
  }

  private requireArity(args: string[], min: number, max: number, syntax: string): void {
    if (args.length < min || args.length > max) throw new Error(`usage: ${syntax}`);
  }
}
