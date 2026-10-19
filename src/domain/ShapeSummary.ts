import { Shape } from "./Shape.js";

export class ShapeSummary {
  static style(shape: Shape): string {
    return ["fill", "stroke", "stroke-width"]
      .flatMap(attribute => shape.get(attribute) === undefined ? [] : [` ${attribute}=${shape.get(attribute)}`])
      .join("");
  }
}
