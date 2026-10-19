import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Circle extends Shape {
  readonly type = "circle";
  allowedAttributes(): ReadonlySet<string> {
    return new Set([...this.commonAttributes(), "cx", "cy", "r"]);
  }
  move(dx: number, dy: number): void { this.translate(["cx"], ["cy"], dx, dy); }
  scale(factor: number): void { this.multiply(["cx", "cy", "r"], factor); }
  clone(): Circle { return new Circle(this.id, this.copyAttributes()); }
  summary(): string {
    return `cx=${this.get("cx")} cy=${this.get("cy")} r=${this.get("r")}${ShapeSummary.style(this)}`;
  }
}
