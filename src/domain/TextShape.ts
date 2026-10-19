import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class TextShape extends Shape {
  readonly type = "text";
  constructor(id: string, attributes: Map<string, string>, private contentValue: string) {
    super(id, attributes);
  }
  get content(): string { return this.contentValue; }
  override get(attribute: string): string | undefined {
    return attribute === "text" ? this.contentValue : super.get(attribute);
  }
  override set(attribute: string, value: string): void {
    if (attribute === "text") { this.contentValue = value; return; }
    super.set(attribute, value);
  }
  allowedAttributes(): ReadonlySet<string> {
    return new Set([...this.commonAttributes(), "x", "y", "text"]);
  }
  move(dx: number, dy: number): void { this.translate(["x"], ["y"], dx, dy); }
  scale(factor: number): void { this.multiply(["x", "y"], factor); }
  clone(): TextShape { return new TextShape(this.id, this.copyAttributes(), this.contentValue); }
  summary(): string {
    return `(${this.get("x")},${this.get("y")}) "${this.contentValue}"${ShapeSummary.style(this)}`;
  }
}
