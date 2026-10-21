import { Group } from "./Group.js";
import { Shape } from "./Shape.js";

export class SvgDocument {
  static isValidId(id: string): boolean { return id.length > 0 && !/\s/u.test(id); }

  // The virtual canvas root is never serialized or addressable by id.
  readonly root = new Group("");
  private readonly rootAttributesValue: Map<string, string>;

  constructor(
    private widthValue: number,
    private heightValue: number,
    private viewBoxValue = `0 0 ${widthValue} ${heightValue}`,
    rootAttributes = new Map<string, string>()
  ) {
    this.rootAttributesValue = new Map(rootAttributes);
  }

  get width(): number { return this.widthValue; }
  get height(): number { return this.heightValue; }
  get viewBox(): string { return this.viewBoxValue; }
  get rootAttributes(): ReadonlyMap<string, string> { return this.rootAttributesValue; }

  importRootAttribute(name: string, value: string): void {
    this.rootAttributesValue.set(name, value);
  }

  resize(width: number, height: number): void {
    this.widthValue = width;
    this.heightValue = height;
    this.viewBoxValue = `0 0 ${width} ${height}`;
  }

  dimensions(): string { return `${this.widthValue}x${this.heightValue}`; }

  count(): number {
    const countChildren = (group: Group): number => group.children.reduce(
      (total, child) => total + 1 + (child instanceof Group ? countChildren(child) : 0), 0
    );
    return countChildren(this.root);
  }

  find(id: string): Shape | undefined {
    const search = (group: Group): Shape | undefined => {
      for (const child of group.children) {
        if (child.id === id) return child;
        if (child instanceof Group) {
          const match = search(child);
          if (match) return match;
        }
      }
      return undefined;
    };
    return search(this.root);
  }

  snapshot(): SvgDocument {
    const copy = new SvgDocument(this.widthValue, this.heightValue,
      this.viewBoxValue, this.rootAttributesValue);
    for (const child of this.root.children) copy.root.add(child.clone());
    return copy;
  }

  restore(snapshot: SvgDocument): void {
    // Prepare plugin-owned clones before touching the live document. A failing
    // clone must leave both the current tree and its undo history usable.
    const children = snapshot.root.children.map(child => child.clone());
    const rootAttributes = new Map(snapshot.rootAttributes);
    for (const child of [...this.root.children]) this.root.remove(child);
    this.widthValue = snapshot.width;
    this.heightValue = snapshot.height;
    this.viewBoxValue = snapshot.viewBox;
    this.rootAttributesValue.clear();
    for (const [name, value] of rootAttributes) this.rootAttributesValue.set(name, value);
    for (const child of children) this.root.add(child);
  }
}
