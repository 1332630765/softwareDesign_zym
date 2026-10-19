import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Rect extends Shape {
  readonly type = "rect";
  summary(): string {
    return `x=${this.get("x")} y=${this.get("y")} w=${this.get("width")} h=${this.get("height")}${ShapeSummary.style(this)}`;
  }
}
