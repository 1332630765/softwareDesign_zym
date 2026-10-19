import { Group } from "./Group.js";
import { Shape } from "./Shape.js";

export class SvgDocument {
  readonly root = new Group("__root__");

  constructor(private widthValue: number, private heightValue: number) {}

  get width(): number { return this.widthValue; }
  get height(): number { return this.heightValue; }

  resize(width: number, height: number): void {
    this.widthValue = width;
    this.heightValue = height;
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
    const copy = new SvgDocument(this.widthValue, this.heightValue);
    for (const child of this.root.children) copy.root.add(child.clone());
    return copy;
  }

  restore(snapshot: SvgDocument): void {
    for (const child of [...this.root.children]) this.root.remove(child);
    this.widthValue = snapshot.width;
    this.heightValue = snapshot.height;
    for (const child of snapshot.root.children) this.root.add(child.clone());
  }
}
