import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Circle extends Shape {
  readonly type = "circle";
  summary(): string {
    return `cx=${this.get("cx")} cy=${this.get("cy")} r=${this.get("r")}${ShapeSummary.style(this)}`;
  }
}
