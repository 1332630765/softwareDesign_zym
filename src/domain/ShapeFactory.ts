import { Shape } from "./Shape.js";
import { Group } from "./Group.js";
import { Rect } from "./Rect.js";
import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Line } from "./Line.js";
import { TextShape } from "./TextShape.js";
import { NumberFormatter } from "./NumberFormatter.js";

export class ShapeFactory {
  private readonly svgCoordinates = new Map<string, string[]>([
    ["rect", ["x", "y", "width", "height"]],
    ["circle", ["cx", "cy", "r"]],
    ["ellipse", ["cx", "cy", "rx", "ry"]],
    ["line", ["x1", "y1", "x2", "y2"]],
    ["text", ["x", "y"]]
  ]);

  supports(type: string): boolean { return type === "g" || this.svgCoordinates.has(type); }

  fromSvg(type: string, id: string, attributes: Map<string, string>, content: string): Shape {
    const fields = this.svgCoordinates.get(type) ?? [];
    const values = fields.map(name => this.svgNumber(attributes.get(name) ?? "0", name));
    const optional = type === "line" ? attributes.get("stroke") : attributes.get("fill");
    const args = type === "text" ? [...values, content]
      : type === "g" ? [] : [...values, ...(optional === undefined ? [] : [optional])];
    const shape = this.create(type, id, args);
    for (const [name, rawValue] of attributes) {
      const value = fields.includes(name) ? this.svgNumber(rawValue, name) : rawValue;
      if (name === "stroke-width") this.svgNumber(value, name);
      shape.importAttribute(name, value);
    }
    return shape;
  }

  private svgNumber(value: string, name: string): string {
    const normalized = value.trim().replace(/px$/i, "");
    const number = Number(normalized);
    if (!NumberFormatter.isGeometryValue(name, normalized)) throw new Error(`invalid SVG: invalid ${name}: ${value}`);
    return number.toString();
  }

  create(type: string, id: string, args: string[]): Shape {
    const numeric = (names: string[], min: number, max: number): Map<string, string> => {
      if (args.length < min || args.length > max) throw new Error(`invalid parameters for ${type}`);
      const attributes = new Map<string, string>();
      names.forEach((name, index) => {
        if (!NumberFormatter.isGeometryValue(name, args[index])) {
          throw new Error(`invalid number: ${args[index]}`);
        }
        attributes.set(name, args[index]);
      });
      return attributes;
    };

    if (type === "g") {
      if (args.length !== 0) throw new Error("usage: create g <id>");
      return new Group(id);
    }
    if (type === "rect") {
      const attributes = numeric(["x", "y", "width", "height"], 4, 5);
      if (args[4] !== undefined) attributes.set("fill", args[4]);
      return new Rect(id, attributes);
    }
    if (type === "circle") {
      const attributes = numeric(["cx", "cy", "r"], 3, 4);
      if (args[3] !== undefined) attributes.set("fill", args[3]);
      return new Circle(id, attributes);
    }
    if (type === "ellipse") {
      const attributes = numeric(["cx", "cy", "rx", "ry"], 4, 5);
      if (args[4] !== undefined) attributes.set("fill", args[4]);
      return new Ellipse(id, attributes);
    }
    if (type === "line") {
      const attributes = numeric(["x1", "y1", "x2", "y2"], 4, 5);
      if (args[4] !== undefined) attributes.set("stroke", args[4]);
      return new Line(id, attributes);
    }
    if (type === "text") {
      const attributes = numeric(["x", "y"], 3, 3);
      return new TextShape(id, attributes, args[2]);
    }
    throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
  }
}
