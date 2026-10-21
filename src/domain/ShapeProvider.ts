import { Shape } from "./Shape.js";

/** A shape type owns both CLI creation and restoration from its SVG representation. */
export interface ShapeProvider {
  readonly type: string;
  readonly svgTag: string;
  readonly svgKind?: string;
  create(id: string, args: string[]): Shape;
  restore(id: string, attributes: Map<string, string>, content: string): Shape;
}
