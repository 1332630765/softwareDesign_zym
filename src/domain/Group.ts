import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Group extends Shape {
  readonly type = "g";
  private readonly childrenValue: Shape[] = [];

  constructor(id: string, attributes = new Map<string, string>()) { super(id, attributes); }

  get children(): readonly Shape[] { return this.childrenValue; }

  add(shape: Shape): void {
    if (shape.parent) throw new Error(`shape already has a parent: ${shape.id}`);
    this.childrenValue.push(shape);
    shape.setParent(this);
  }

  summary(): string { return ShapeSummary.style(this).trim(); }
}
