import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Line extends Shape {
  readonly type = "line";
  summary(): string {
    return `(${this.get("x1")},${this.get("y1")}) -> (${this.get("x2")},${this.get("y2")})${ShapeSummary.style(this)}`;
  }
}
