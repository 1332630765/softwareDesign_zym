import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Line extends Shape {
  readonly type = "line";
  allowedAttributes(): ReadonlySet<string> {
    return new Set([...this.commonAttributes(), "x1", "y1", "x2", "y2"]);
  }
  move(dx: number, dy: number): void { this.translate(["x1", "x2"], ["y1", "y2"], dx, dy); }
  scale(factor: number): void { this.multiply(["x1", "y1", "x2", "y2"], factor); }
  clone(): Line { return new Line(this.id, this.copyAttributes()); }
  summary(): string {
    return `(${this.get("x1")},${this.get("y1")}) -> (${this.get("x2")},${this.get("y2")})${ShapeSummary.style(this)}`;
  }
}
