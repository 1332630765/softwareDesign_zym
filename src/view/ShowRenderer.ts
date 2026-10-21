import { Group } from "../domain/Group.js";
import { Shape } from "../domain/Shape.js";
import { SvgDocument } from "../domain/SvgDocument.js";
import { TextShape } from "../domain/TextShape.js";

export class ShowRenderer {
  render(document: SvgDocument, shape: Shape): string {
    const parent = shape.parent === document.root ? "svg" : `g#${shape.parent!.id}`;
    const styleNames = new Set(["fill", "stroke", "stroke-width"]);
    const attributes = [...shape.attrs];
    const geometry = attributes.filter(([name]) => !styleNames.has(name));
    const styles = attributes.filter(([name]) => styleNames.has(name));
    const lines = [`${shape.label}  parent=${parent}`];
    if (geometry.length) lines.push(`  ${geometry.map(([name, value]) => `${name}=${value}`).join(" ")}`);
    if (styles.length) lines.push(`  ${styles.map(([name, value]) => `${name}=${value}`).join(" ")}`);
    if (shape instanceof Group) lines.push(`  children=${shape.children.length}`);
    if (shape instanceof TextShape) lines.push(`  text="${shape.content}"`);
    return lines.join("\n");
  }
}
