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
}
