import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Ellipse extends Shape {
  readonly type = "ellipse";
  summary(): string {
    return `cx=${this.get("cx")} cy=${this.get("cy")} rx=${this.get("rx")} ry=${this.get("ry")}${ShapeSummary.style(this)}`;
  }
}
