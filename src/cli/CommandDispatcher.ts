import { SvgEditor } from "../application/SvgEditor.js";

export class CommandDispatcher {
  constructor(private readonly editor: SvgEditor) {}

  dispatch(line: string): string {
    const input = line.trim();
    if (!input || input.startsWith("#")) return "";
    const [name, ...args] = input.split(/\s+/);
    switch (name) {
      case "init":
        this.requireArity(args, 0, 2, "init [w] [h]");
        return this.editor.init(this.number(args[0], 800), this.number(args[1], 600));
      case "canvas":
        this.requireArity(args, 0, 2, "canvas [w] [h]");
        if (args.length === 1) throw new Error("usage: canvas [w] [h]");
        return args.length === 0 ? this.editor.canvas() : this.editor.canvas(this.number(args[0]), this.number(args[1]));
      case "help":
        this.requireArity(args, 0, 0, "help");
        return "Available now: init [w] [h], canvas [w] [h], help. More commands will be added in later stages.";
      default:
        throw new Error(`unknown command: ${name}`);
    }
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
