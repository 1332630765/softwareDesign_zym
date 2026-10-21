import { NumberFormatter } from "./NumberFormatter.js";
import { Shape } from "./Shape.js";
import { ShapeProvider } from "./ShapeProvider.js";

/** Shared argument and SVG-number handling for the six built-in shapes. */
export class BuiltinShapeProvider implements ShapeProvider {
  readonly svgTag: string;

  constructor(
    readonly type: string,
    private readonly fields: readonly string[],
    private readonly optionalStyle: string | undefined,
    private readonly textContent: boolean,
    private readonly construct: (id: string, attributes: Map<string, string>, content: string) => Shape,
    private readonly usage?: string
  ) {
    this.svgTag = type;
  }

  create(id: string, args: string[]): Shape {
    const required = this.fields.length + (this.textContent ? 1 : 0);
    const maximum = required + (this.optionalStyle ? 1 : 0);
    if (args.length < required || args.length > maximum) {
      throw new Error(this.usage ?? `invalid parameters for ${this.type}`);
    }
    const attributes = new Map<string, string>();
    this.fields.forEach((name, index) => {
      if (!NumberFormatter.isGeometryValue(name, args[index])) {
        throw new Error(`invalid number: ${args[index]}`);
      }
      attributes.set(name, args[index]);
    });
    if (this.optionalStyle && args[required] !== undefined) {
      attributes.set(this.optionalStyle, args[required]);
    }
    return this.construct(id, attributes, this.textContent ? args[this.fields.length] : "");
  }

  restore(id: string, attributes: Map<string, string>, content: string): Shape {
    const values = this.fields.map(name => this.svgNumber(attributes.get(name) ?? "0", name));
    const optional = this.optionalStyle ? attributes.get(this.optionalStyle) : undefined;
    const args = this.textContent ? [...values, content]
      : [...values, ...(optional === undefined ? [] : [optional])];
    const shape = this.create(id, args);
    for (const [name, rawValue] of attributes) {
      const value = this.fields.includes(name) ? this.svgNumber(rawValue, name) : rawValue;
      if (name === "stroke-width") this.svgNumber(value, name);
      shape.importAttribute(name, value);
    }
    return shape;
  }

  private svgNumber(value: string, name: string): string {
    const normalized = value.trim().replace(/px$/i, "");
    const number = Number(normalized);
    if (!NumberFormatter.isGeometryValue(name, normalized)) {
      throw new Error(`invalid SVG: invalid ${name}: ${value}`);
    }
    return number.toString();
  }
}
