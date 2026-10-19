import { SvgDocument } from "../domain/SvgDocument.js";

export class SvgEditor {
  private current?: SvgDocument;

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
