import { Shape } from "./Shape.js";
import { ShapeSummary } from "./ShapeSummary.js";

export class Group extends Shape {
  readonly type = "g";
  private readonly childrenValue: Shape[] = [];

  constructor(id: string, attributes = new Map<string, string>()) { super(id, attributes); }

  get children(): readonly Shape[] { return this.childrenValue; }

  add(shape: Shape, index = this.childrenValue.length): void {
    if (shape === this || (shape instanceof Group && shape.contains(this))) {
      throw new Error(`cannot add a container into its own descendant: ${shape.id}`);
    }
    shape.parent?.remove(shape);
    this.childrenValue.splice(index, 0, shape);
    shape.setParent(this);
  }

  remove(shape: Shape): void {
    const index = this.childrenValue.indexOf(shape);
    if (index < 0) throw new Error(`shape is not a child: ${shape.id}`);
    this.childrenValue.splice(index, 1);
    shape.setParent(null);
  }

  contains(shape: Shape): boolean {
    return this.childrenValue.some(child => child === shape || (child instanceof Group && child.contains(shape)));
  }

  allowedAttributes(): ReadonlySet<string> { return new Set(this.commonAttributes()); }
  move(dx: number, dy: number): void { for (const child of this.childrenValue) child.move(dx, dy); }
  scale(factor: number): void { for (const child of this.childrenValue) child.scale(factor); }
  clone(): Group {
    const copy = new Group(this.id, this.copyAttributes());
    for (const child of this.childrenValue) copy.add(child.clone());
    return copy;
  }

  summary(): string { return ShapeSummary.style(this).trim(); }
}
