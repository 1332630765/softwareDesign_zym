import { SvgDocument } from "../domain/SvgDocument.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { Shape } from "../domain/Shape.js";
import { Group } from "../domain/Group.js";
import { TextShape } from "../domain/TextShape.js";

export class SvgEditor {
  private current?: SvgDocument;
  constructor(private readonly factory = new ShapeFactory()) {}

  init(width = 800, height = 600): string {
    this.validateSize(width, height);
    this.current = new SvgDocument(width, height);
    return `canvas ${this.current.dimensions()} created`;
  }

  canvas(width?: number, height?: number): string {
    const document = this.requireDocument();
    if (width === undefined && height === undefined) return `canvas ${document.dimensions()}`;
    if (width === undefined || height === undefined) throw new Error("usage: canvas [w] [h]");
    this.validateSize(width, height);
    document.resize(width, height);
    return `canvas resized to ${document.dimensions()}`;
  }

  create(type: string, id: string, args: string[], containerId?: string): string {
    const document = this.requireDocument();
    if (!id) throw new Error("id is required");
    if (document.find(id)) throw new Error(`id already exists: ${id}`);

    let parent = document.root;
    if (containerId !== undefined) {
      const target = document.find(containerId);
      if (!target) throw new Error(`no such container: ${containerId}`);
      if (!(target instanceof Group)) throw new Error(`not a container: ${containerId}`);
      parent = target;
    }
    const shape = this.factory.create(type, id, args);
    parent.add(shape);
    return `${shape.type}#${id} created${parent === document.root ? "" : ` in g#${parent.id}`}`;
  }

  tree(id?: string): string {
    const document = this.requireDocument();
    if (id !== undefined) return this.treeLines(this.requireShape(id), "", true).join("\n");
    const lines = [`svg (${document.dimensions()})`];
    document.root.children.forEach((shape, index) => {
      lines.push(...this.treeLines(shape, "", index === document.root.children.length - 1));
    });
    return lines.join("\n");
  }

  show(id: string): string {
    const document = this.requireDocument();
    const shape = this.requireShape(id);
    const parent = shape.parent === document.root ? "svg" : `g#${shape.parent!.id}`;
    const details = shape instanceof Group
      ? [`children=${shape.children.length}`]
      : [...shape.attrs].map(([name, value]) => `${name}=${value}`);
    if (shape instanceof TextShape) details.push(`text="${shape.content}"`);
    return `${shape.type}#${shape.id}  parent=${parent}\n  ${details.join(" ")}`;
  }

  private requireShape(id: string): Shape {
    const shape = this.requireDocument().find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  private treeLines(shape: Shape, prefix: string, last: boolean): string[] {
    const summary = shape.summary();
    const lines = [`${prefix}${last ? "└── " : "├── "}${shape.type}#${shape.id}${summary ? `  ${summary}` : ""}`];
    if (shape instanceof Group) {
      shape.children.forEach((child, index) => {
        lines.push(...this.treeLines(child, prefix + (last ? "    " : "│   "), index === shape.children.length - 1));
      });
    }
    return lines;
  }

  private requireDocument(): SvgDocument {
    if (!this.current) throw new Error("no document. use 'init' or 'read' first");
    return this.current;
  }

  private validateSize(width: number, height: number): void {
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      throw new Error("canvas size must be positive");
    }
  }
}
