import { Shape } from "./Shape.js";
import { Group } from "./Group.js";
import { Rect } from "./Rect.js";
import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Line } from "./Line.js";
import { TextShape } from "./TextShape.js";
import { ShapeProvider } from "./ShapeProvider.js";
import { BuiltinShapeProvider } from "./BuiltinShapeProvider.js";

export class ShapeFactory {
  private readonly byType = new Map<string, ShapeProvider>();
  private readonly bySvg = new Map<string, ShapeProvider>();
  private readonly svgTags = new Set<string>();

  constructor() {
    this.register(new BuiltinShapeProvider("g", [], undefined, false,
      id => new Group(id), "usage: create g <id>"));
    this.register(new BuiltinShapeProvider("rect", ["x", "y", "width", "height"], "fill", false,
      (id, attributes) => new Rect(id, attributes)));
    this.register(new BuiltinShapeProvider("circle", ["cx", "cy", "r"], "fill", false,
      (id, attributes) => new Circle(id, attributes)));
    this.register(new BuiltinShapeProvider("ellipse", ["cx", "cy", "rx", "ry"], "fill", false,
      (id, attributes) => new Ellipse(id, attributes)));
    this.register(new BuiltinShapeProvider("line", ["x1", "y1", "x2", "y2"], "stroke", false,
      (id, attributes) => new Line(id, attributes)));
    this.register(new BuiltinShapeProvider("text", ["x", "y"], undefined, true,
      (id, attributes, content) => new TextShape(id, attributes, content)));
  }

  register(provider: ShapeProvider): void {
    const key = this.svgKey(provider.svgTag, provider.svgKind);
    if (this.byType.has(provider.type) || this.bySvg.has(key)) {
      throw new Error(`shape provider already registered: ${provider.type}`);
    }
    this.byType.set(provider.type, provider);
    this.bySvg.set(key, provider);
    this.svgTags.add(provider.svgTag);
  }

  supports(type: string): boolean { return this.byType.has(type); }
  supportsSvg(tag: string): boolean { return this.svgTags.has(tag); }

  create(type: string, id: string, args: string[]): Shape {
    const provider = this.byType.get(type);
    if (!provider) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return provider.create(id, args);
  }

  fromSvg(tag: string, id: string, attributes: Map<string, string>, content: string): Shape {
    const kind = attributes.get("data-kind");
    const provider = (kind ? this.bySvg.get(this.svgKey(tag, kind)) : undefined)
      ?? this.bySvg.get(this.svgKey(tag));
    if (!provider) throw new Error(`invalid SVG: unsupported element <${tag}>`);
    return provider.restore(id, attributes, content);
  }

  private svgKey(tag: string, kind?: string): string { return `${tag}\u0000${kind ?? ""}`; }
}
