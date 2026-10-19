import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Ellipse extends Shape {
  readonly type = "ellipse";
  allowedAttributes(): ReadonlySet<string> {
    return new Set([...this.commonAttributes(), "cx", "cy", "rx", "ry"]);
  }
  move(dx: number, dy: number): void { this.translate(["cx"], ["cy"], dx, dy); }
  scale(factor: number): void { this.multiply(["cx", "cy", "rx", "ry"], factor); }
  clone(): Ellipse { return new Ellipse(this.id, this.copyAttributes()); }
  summary(): string {
    return `cx=${this.get("cx")} cy=${this.get("cy")} rx=${this.get("rx")} ry=${this.get("ry")}${ShapeSummary.style(this)}`;
  }
}
