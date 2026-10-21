import { Rect } from "../../domain/Rect.js";
import { Shape } from "../../domain/Shape.js";
import { ShapeProvider } from "../../domain/ShapeProvider.js";
import { Badge } from "./Badge.js";

export class BadgeProvider implements ShapeProvider {
  readonly type = "badge";
  readonly svgTag = "g";
  readonly svgKind = "badge";

  create(id: string, args: string[]): Shape {
    if (args.length) throw new Error("invalid parameters for badge");
    const badge = new Badge(id);
    badge.add(new Rect(`${id}-rect`, new Map([
      ["x", "0"], ["y", "0"], ["width", "10"], ["height", "10"]
    ])));
    return badge;
  }

  restore(id: string, attributes: Map<string, string>): Shape {
    return new Badge(id, attributes);
  }
}
