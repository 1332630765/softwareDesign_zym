export abstract class Shape {
  private parentValue: Group | null = null;

  constructor(public readonly id: string, private readonly attributes: Map<string, string>) {}

  abstract readonly type: string;
  abstract summary(): string;
  abstract allowedAttributes(): ReadonlySet<string>;
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;

  get parent(): Group | null { return this.parentValue; }
  get attrs(): ReadonlyMap<string, string> { return this.attributes; }
  get(attribute: string): string | undefined { return this.attributes.get(attribute); }

  set(attribute: string, value: string): void {
    if (!this.allowedAttributes().has(attribute)) throw new Error(`unknown attribute: ${attribute}`);
    this.attributes.set(attribute, value);
  }

  importAttribute(attribute: string, value: string): void {
    this.attributes.set(attribute, value);
  }

  setParent(parent: Group | null): void { this.parentValue = parent; }

  protected commonAttributes(): string[] { return ["fill", "stroke", "stroke-width"]; }
  protected copyAttributes(): Map<string, string> { return new Map(this.attributes); }
  protected coordinate(attribute: string): number { return Number(this.attributes.get(attribute)); }
  protected change(attribute: string, value: number): void {
    this.attributes.set(attribute, NumberFormatter.format(value));
  }
  protected translate(xFields: string[], yFields: string[], dx: number, dy: number): void {
    for (const field of xFields) this.change(field, this.coordinate(field) + dx);
    for (const field of yFields) this.change(field, this.coordinate(field) + dy);
  }
  protected multiply(fields: string[], factor: number): void {
    for (const field of fields) this.change(field, this.coordinate(field) * factor);
  }
}

import { Group } from "./Group.js";
import { NumberFormatter } from "./NumberFormatter.js";
