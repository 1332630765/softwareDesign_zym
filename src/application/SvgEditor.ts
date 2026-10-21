import { SvgDocument } from "../domain/SvgDocument.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { Shape } from "../domain/Shape.js";
import { CommandHistory } from "./CommandHistory.js";
import { SvgFileStore } from "../infrastructure/SvgFileStore.js";
import { SvgParser } from "../infrastructure/SvgParser.js";
import { SvgSerializer } from "../infrastructure/SvgSerializer.js";
import { TreeRenderer } from "../view/TreeRenderer.js";
import { ShowRenderer } from "../view/ShowRenderer.js";
import { ShapeEditingService } from "./ShapeEditingService.js";

export class SvgEditor {
  private current?: SvgDocument;
  private currentPath?: string;
  private readonly history = new CommandHistory();
  private readonly treeRenderer = new TreeRenderer();
  private readonly showRenderer = new ShowRenderer();
  private readonly editing: ShapeEditingService;
  private readonly parser: SvgParser;
  constructor(
    private readonly factory = new ShapeFactory(),
    private readonly files = new SvgFileStore(),
    parser?: SvgParser,
    private readonly serializer = new SvgSerializer()
  ) {
    this.parser = parser ?? new SvgParser(this.factory);
    this.editing = new ShapeEditingService(() => this.requireDocument(), this.history, this.factory);
  }

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
    return this.editing.create(type, id, args, containerId);
  }

  delete(id: string): string { return this.editing.delete(id); }
  move(id: string, dx: number, dy: number): string { return this.editing.move(id, dx, dy); }
  scale(id: string, factor: number): string { return this.editing.scale(id, factor); }
  set(id: string, attribute: string, value: string): string { return this.editing.set(id, attribute, value); }
  group(id: string, ids: string[]): string { return this.editing.group(id, ids); }
  ungroup(id: string): string { return this.editing.ungroup(id); }
  addTo(containerId: string, id: string): string { return this.editing.addTo(containerId, id); }
  reorder(id: string, front: boolean): string { return this.editing.reorder(id, front); }

  undo(): string { this.requireDocument(); return this.history.undo(); }
  redo(): string { this.requireDocument(); return this.history.redo(); }

  tree(id?: string): string {
    const document = this.requireDocument();
    return this.treeRenderer.render(document, id === undefined ? undefined : this.requireShape(id));
  }

  show(id: string): string {
    const document = this.requireDocument();
    return this.showRenderer.render(document, this.requireShape(id));
  }

  private requireShape(id: string): Shape {
    const shape = this.requireDocument().find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
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
