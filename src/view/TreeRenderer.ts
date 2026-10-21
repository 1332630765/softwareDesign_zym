import { Group } from "../domain/Group.js";
import { Shape } from "../domain/Shape.js";
import { SvgDocument } from "../domain/SvgDocument.js";

export class TreeRenderer {
  render(document: SvgDocument, shape?: Shape): string {
    if (shape) return this.lines(shape, "", true).join("\n");

    const lines = [`svg (${document.dimensions()})`];
    document.root.children.forEach((child, index) => {
      lines.push(...this.lines(child, "", index === document.root.children.length - 1));
    });
    return lines.join("\n");
  }

  private lines(shape: Shape, prefix: string, last: boolean): string[] {
    const summary = shape.summary();
    const lines = [`${prefix}${last ? "└── " : "├── "}${shape.label}${summary ? `  ${summary}` : ""}`];
    if (shape instanceof Group) {
      shape.children.forEach((child, index) => {
        lines.push(...this.lines(child, prefix + (last ? "    " : "│   "), index === shape.children.length - 1));
      });
    }
    return lines;
  }
}
