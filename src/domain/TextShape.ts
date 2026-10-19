import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class TextShape extends Shape {
  readonly type = "text";
  constructor(id: string, attributes: Map<string, string>, private readonly contentValue: string) {
    super(id, attributes);
  }
  get content(): string { return this.contentValue; }
  summary(): string {
    return `(${this.get("x")},${this.get("y")}) "${this.contentValue}"${ShapeSummary.style(this)}`;
  }
}
