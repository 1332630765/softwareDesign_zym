import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Rect extends Shape {
  readonly type = "rect";
  allowedAttributes(): ReadonlySet<string> {
    return new Set([...this.commonAttributes(), "x", "y", "width", "height"]);
  }
  move(dx: number, dy: number): void { this.translate(["x"], ["y"], dx, dy); }
  scale(factor: number): void { this.multiply(["x", "y", "width", "height"], factor); }
  clone(): Rect { return new Rect(this.id, this.copyAttributes()); }
  summary(): string {
    return `x=${this.get("x")} y=${this.get("y")} w=${this.get("width")} h=${this.get("height")}${ShapeSummary.style(this)}`;
  }
}
