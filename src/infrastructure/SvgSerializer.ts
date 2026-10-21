import { SvgDocument } from "../domain/SvgDocument.js";
import { Shape } from "../domain/Shape.js";
import { Group } from "../domain/Group.js";
import { TextShape } from "../domain/TextShape.js";
import { XmlCodec } from "./XmlCodec.js";

export class SvgSerializer {
  serialize(document: SvgDocument): string {
    const rootAttributes = [...document.rootAttributes]
      .map(([name, value]) => `${name}="${XmlCodec.escape(value)}"`);
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="${XmlCodec.escape(document.viewBox)}"${rootAttributes.length ? ` ${rootAttributes.join(" ")}` : ""}>`
    ];
    for (const shape of document.root.children) this.write(shape, 1, lines);
    lines.push("</svg>");
    return lines.join("\n") + "\n";
  }

  private write(shape: Shape, depth: number, lines: string[]): void {
    const indent = "  ".repeat(depth);
    const attributes = [`id="${XmlCodec.escape(shape.id)}"`,
      ...[...shape.attrs].map(([name, value]) => `${name}="${XmlCodec.escape(value)}"`)];
    const opening = `${indent}<${shape.svgTag} ${attributes.join(" ")}`;
    if (shape instanceof Group) {
      if (shape.children.length === 0) { lines.push(`${opening}/>`); return; }
      lines.push(`${opening}>`);
      for (const child of shape.children) this.write(child, depth + 1, lines);
      lines.push(`${indent}</${shape.svgTag}>`);
    } else if (shape instanceof TextShape) {
      lines.push(`${opening}>${XmlCodec.escape(shape.content)}</${shape.svgTag}>`);
    } else {
      lines.push(`${opening}/>`);
    }
  }
}
