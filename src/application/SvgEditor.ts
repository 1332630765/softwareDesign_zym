import { SvgDocument } from "../domain/SvgDocument.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { Shape } from "../domain/Shape.js";
import { Group } from "../domain/Group.js";
import { TextShape } from "../domain/TextShape.js";
import { NumberFormatter } from "../domain/NumberFormatter.js";
import { CommandHistory } from "./CommandHistory.js";
import { SnapshotCommand } from "./SnapshotCommand.js";
import { SvgFileStore } from "../infrastructure/SvgFileStore.js";
import { SvgParser } from "../infrastructure/SvgParser.js";
import { SvgSerializer } from "../infrastructure/SvgSerializer.js";

export class SvgEditor {
  private current?: SvgDocument;
  private currentPath?: string;
  private readonly history = new CommandHistory();
  constructor(
    private readonly factory = new ShapeFactory(),
    private readonly files = new SvgFileStore(),
    private readonly parser = new SvgParser(),
    private readonly serializer = new SvgSerializer()
  ) {}

  init(width = 800, height = 600): string {
    this.validateSize(width, height);
    this.current = new SvgDocument(width, height);
    this.currentPath = undefined;
    this.history.afterIo();
    return `canvas ${this.current.dimensions()} created`;
  }

  read(file: string): string {
    const { path, content } = this.files.read(file);
    const result = this.parser.parse(content);
    this.current = result.document;
    this.currentPath = path;
    this.history.afterIo();
    return [...result.warnings, `read ${file} (${result.document.count()} elements)`].join("\n");
  }

  save(file?: string): string {
    const document = this.requireDocument();
    const target = file ?? this.currentPath;
    if (!target) throw new Error("no file path. use 'save <file.svg>'");
    const path = this.files.write(target, this.serializer.serialize(document));
    this.currentPath = path;
    this.history.afterIo();
    return `saved to ${file ?? target} (${document.count()} elements)`;
  }

  canvas(width?: number, height?: number): string {
    const document = this.requireDocument();
    if (width === undefined && height === undefined) return `canvas ${document.dimensions()}`;
    if (width === undefined || height === undefined) throw new Error("usage: canvas [w] [h]");
    this.validateSize(width, height);
    document.resize(width, height);
    this.history.afterIo();
    return `canvas resized to ${document.dimensions()}`;
  }

  create(type: string, id: string, args: string[], containerId?: string): string {
    const document = this.requireDocument();
    if (!id) throw new Error("id is required");
    if (!SvgDocument.isValidId(id)) throw new Error(`invalid id: ${id}`);
    if (document.find(id)) throw new Error(`id already exists: ${id}`);

    let parent = document.root;
    if (containerId !== undefined) {
      const target = document.find(containerId);
      if (!target) throw new Error(`no such container: ${containerId}`);
      if (!(target instanceof Group)) throw new Error(`not a container: ${containerId}`);
      parent = target;
    }
    const shape = this.factory.create(type, id, args);
    const message = `${shape.type}#${id} created${parent === document.root ? "" : ` in g#${parent.id}`}`;
    return this.edit(() => { parent.add(shape); return message; }, `${shape.type}#${id} removed`, message);
  }

  delete(id: string): string {
    const shape = this.requireShape(id);
    const parent = shape.parent!;
    const message = `${shape.type}#${id} deleted`;
    const location = parent === this.requireDocument().root ? "svg" : `g#${parent.id}`;
    return this.edit(() => { parent.remove(shape); return message; },
      `${shape.type}#${id} restored into ${location}`, message);
  }

  move(id: string, dx: number, dy: number): string {
    this.validateFinite(dx);
    this.validateFinite(dy);
    const shape = this.requireShape(id);
    const original = this.position(shape);
    const message = shape instanceof Group
      ? `g#${id} moved by (${dx},${dy})`
      : `${shape.type}#${id} moved to ${this.nextPosition(shape, dx, dy)}`;
    const undone = shape instanceof Group
      ? `g#${id} moved back by (${-dx},${-dy})`
      : `${shape.type}#${id} moved back to ${original}`;
    return this.edit(() => { shape.move(dx, dy); return message; }, undone, message);
  }

  scale(id: string, factor: number): string {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
    const shape = this.requireShape(id);
    const message = `${shape.type}#${id} scaled by ${factor}`;
    return this.edit(() => { shape.scale(factor); return message; },
      `${shape.type}#${id} scale restored`, message);
  }

  set(id: string, attribute: string, value: string): string {
    const shape = this.requireShape(id);
    if (!shape.allowedAttributes().has(attribute)) throw new Error(`unknown attribute: ${attribute}`);
    const numeric = new Set(["x", "y", "width", "height", "cx", "cy", "r", "rx", "ry",
      "x1", "y1", "x2", "y2", "stroke-width"]);
    if (numeric.has(attribute) && !NumberFormatter.isGeometryValue(attribute, value)) {
      throw new Error(`invalid number: ${value}`);
    }
    const previous = shape.get(attribute);
    const message = `${shape.type}#${id} updated: ${attribute}="${value}"`;
    return this.edit(() => { shape.set(attribute, value); return message; },
      `${shape.type}#${id} updated: ${attribute}="${previous ?? ""}"`, message);
  }

  group(id: string, ids: string[]): string {
    if (ids.length === 0) throw new Error("usage: group <newGid> <id1> <id2> ...");
    const document = this.requireDocument();
    if (!id) throw new Error("id is required");
    if (!SvgDocument.isValidId(id)) throw new Error(`invalid id: ${id}`);
    if (document.find(id)) throw new Error(`id already exists: ${id}`);
    const shapes = ids.map(shapeId => this.requireShape(shapeId));
    if (new Set(shapes).size !== shapes.length) throw new Error("duplicate shape in group");
    for (const shape of shapes) {
      if (shape instanceof Group && shapes.some(other => other !== shape && shape.contains(other))) {
        throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
    const anchor = shapes[0];
    const parent = anchor.parent!;
    const index = parent.children.indexOf(anchor);
    const order = this.documentOrder(document);
    shapes.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const container = new Group(id);
    const message = `g#${id} created with ${shapes.length} children`;
    return this.edit(() => {
      parent.add(container, index);
      for (const shape of shapes) container.add(shape);
      return message;
    }, `g#${id} removed; ${shapes.length} children restored`, message);
  }

  ungroup(id: string): string {
    const shape = this.requireShape(id);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    const parent = shape.parent!;
    if (parent === this.requireDocument().root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.children.indexOf(shape);
    const count = shape.children.length;
    const message = `g#${id} ungrouped (${count} children promoted)`;
    return this.edit(() => {
      parent.remove(shape);
      let position = index;
      for (const child of [...shape.children]) parent.add(child, position++);
      return message;
    }, `g#${id} regrouped`, message);
  }

  addTo(containerId: string, id: string): string {
    const target = this.requireShape(containerId);
    if (!(target instanceof Group)) throw new Error(`not a container: ${containerId}`);
    const shape = this.requireShape(id);
    if (shape === target || (shape instanceof Group && shape.contains(target))) {
      throw new Error(`cannot add a container into its own descendant: ${id}`);
    }
    const oldParent = shape.parent!;
    const oldLocation = oldParent === this.requireDocument().root ? "svg" : `g#${oldParent.id}`;
    const message = `${shape.type}#${id} moved into g#${containerId}`;
    return this.edit(() => { target.add(shape); return message; },
      `${shape.type}#${id} moved back into ${oldLocation}`, message);
  }

  reorder(id: string, front: boolean): string {
    const shape = this.requireShape(id);
    const parent = shape.parent!;
    const destination = front ? "front" : "back";
    const message = `${shape.type}#${id} moved to ${destination}`;
    return this.edit(() => {
      parent.remove(shape);
      parent.add(shape, front ? parent.children.length : 0);
      return message;
    }, `${shape.type}#${id} z-order restored`, message);
  }

  undo(): string { this.requireDocument(); return this.history.undo(); }
  redo(): string { this.requireDocument(); return this.history.redo(); }

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
    const styleNames = new Set(["fill", "stroke", "stroke-width"]);
    const attributes = [...shape.attrs];
    const geometry = attributes.filter(([name]) => !styleNames.has(name));
    const styles = attributes.filter(([name]) => styleNames.has(name));
    const lines = [`${shape.type}#${shape.id}  parent=${parent}`];
    if (geometry.length) lines.push(`  ${geometry.map(([name, value]) => `${name}=${value}`).join(" ")}`);
    if (styles.length) lines.push(`  ${styles.map(([name, value]) => `${name}=${value}`).join(" ")}`);
    if (shape instanceof Group) lines.push(`  children=${shape.children.length}`);
    if (shape instanceof TextShape) lines.push(`  text="${shape.content}"`);
    return lines.join("\n");
  }

  private requireShape(id: string): Shape {
    const shape = this.requireDocument().find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }

  private edit(action: () => string, undoMessage: string, redoMessage: string): string {
    return this.history.execute(new SnapshotCommand(this.requireDocument(), action, undoMessage, redoMessage));
  }

  private documentOrder(document: SvgDocument): Shape[] {
    const result: Shape[] = [];
    const visit = (group: Group): void => {
      for (const child of group.children) {
        result.push(child);
        if (child instanceof Group) visit(child);
      }
    };
    visit(document.root);
    return result;
  }

  private position(shape: Shape): string {
    const x = shape.get("x") ?? shape.get("cx") ?? shape.get("x1") ?? "0";
    const y = shape.get("y") ?? shape.get("cy") ?? shape.get("y1") ?? "0";
    return `(${x},${y})`;
  }

  private nextPosition(shape: Shape, dx: number, dy: number): string {
    const x = Number(shape.get("x") ?? shape.get("cx") ?? shape.get("x1") ?? 0) + dx;
    const y = Number(shape.get("y") ?? shape.get("cy") ?? shape.get("y1") ?? 0) + dy;
    return `(${NumberFormatter.format(x)},${NumberFormatter.format(y)})`;
  }

  private validateFinite(value: number): void {
    if (!Number.isFinite(value)) throw new Error(`invalid number: ${value}`);
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
