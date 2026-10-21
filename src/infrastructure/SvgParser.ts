import { DOMParser, type Element } from "@xmldom/xmldom";
import { SvgDocument } from "../domain/SvgDocument.js";
import { Shape } from "../domain/Shape.js";
import { Group } from "../domain/Group.js";
import { TextShape } from "../domain/TextShape.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { NumberFormatter } from "../domain/NumberFormatter.js";

export interface SvgParseResult {
  document: SvgDocument;
  warnings: string[];
}

export class SvgParser {
  constructor(private readonly factory = new ShapeFactory()) {}

  parse(source: string): SvgParseResult {
    if (/<!DOCTYPE\b|<!ENTITY\b/i.test(source)) throw new Error("invalid SVG: DTD is not supported");
    let xml;
    try {
      xml = new DOMParser({ onError: (_level, message) => { throw new Error(message); } })
        .parseFromString(source, "image/svg+xml");
    } catch (error) {
      throw new Error(`invalid SVG: ${error instanceof Error ? error.message : String(error)}`);
    }
    const root = xml.documentElement;
    if (!root || root.localName !== "svg") throw new Error("invalid SVG: missing <svg> root");
    this.checkNamespace(root);

    const viewBoxSource = root.getAttribute("viewBox");
    const viewBoxParts = viewBoxSource?.trim().split(/[\s,]+/);
    if (viewBoxParts && (viewBoxParts.length !== 4 || viewBoxParts.some(part => !NumberFormatter.isNumber(part))
      || Number(viewBoxParts[2]) <= 0 || Number(viewBoxParts[3]) <= 0)) {
      throw new Error("invalid SVG: invalid viewBox");
    }
    const width = this.number(root.getAttribute("width") ?? viewBoxParts?.[2] ?? "800", "width");
    const height = this.number(root.getAttribute("height") ?? viewBoxParts?.[3] ?? "600", "height");
    if (width <= 0 || height <= 0) throw new Error("invalid SVG: canvas size must be positive");
    const document = new SvgDocument(width, height,
      viewBoxSource ?? `0 0 ${width} ${height}`);
    for (let index = 0; index < root.attributes.length; index++) {
      const attribute = root.attributes.item(index)!;
      if (["xmlns", "width", "height", "viewBox"].includes(attribute.name)) continue;
      document.importRootAttribute(attribute.name, attribute.value);
    }
    const explicitIds = new Set<string>();
    this.collectIds(root, explicitIds);
    const assigned = new Set(explicitIds);
    const counters = new Map<string, number>();
    const warnings: string[] = [];
    this.appendChildren(root, document.root, assigned, counters, warnings);
    return { document, warnings };
  }

  private collectIds(element: Element, ids: Set<string>): void {
    for (const child of Array.from(element.children)) {
      this.checkNamespace(child);
      const type = child.localName ?? child.tagName;
      if (!this.factory.supportsSvg(type)) throw new Error(`invalid SVG: unsupported element <${type}>`);
      const id = child.getAttribute("id");
      if (id) {
        if (!SvgDocument.isValidId(id)) throw new Error(`invalid SVG: invalid id: ${id}`);
        if (ids.has(id)) throw new Error(`id already exists: ${id}`);
        ids.add(id);
      }
      this.collectIds(child, ids);
    }
  }

  private appendChildren(element: Element, parent: Group, used: Set<string>,
    counters: Map<string, number>, warnings: string[]): void {
    if (Array.from(element.childNodes).some(node => (node.nodeType === 3 || node.nodeType === 4)
      && (node.nodeValue ?? "").trim() !== "")) {
      throw new Error(`invalid SVG: unsupported text content in <${element.localName}>`);
    }
    for (const child of Array.from(element.children)) {
      const type = child.localName ?? child.tagName;
      let id = child.getAttribute("id") ?? "";
      if (!id) {
        let number = counters.get(type) ?? 0;
        do { number++; id = `${type}${number}`; } while (used.has(id));
        counters.set(type, number);
        used.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      const shape = this.restoreShape(child, type, id);
      parent.add(shape);
      if (shape instanceof Group) this.appendChildren(child, shape, used, counters, warnings);
      else if (child.children.length > 0) throw new Error(`invalid SVG: nested content in <${type}>`);
      else if (!(shape instanceof TextShape) && (child.textContent ?? "").trim() !== "") {
        throw new Error(`invalid SVG: unsupported text content in <${type}>`);
      }
    }
  }

  private restoreShape(element: Element, type: string, id: string): Shape {
    const attributes = new Map<string, string>();
    for (let index = 0; index < element.attributes.length; index++) {
      const attribute = element.attributes.item(index)!;
      if (attribute.name === "id" || attribute.name === "xmlns") continue;
      attributes.set(attribute.name, attribute.value);
    }
    return this.factory.fromSvg(type, id, attributes, element.textContent ?? "");
  }

  private number(value: string, name: string): number {
    const normalized = value.trim().replace(/px$/i, "");
    const number = Number(normalized);
    if (!NumberFormatter.isNumber(normalized)) throw new Error(`invalid SVG: invalid ${name}: ${value}`);
    return number;
  }

  private checkNamespace(element: Element): void {
    if (element.namespaceURI && element.namespaceURI !== "http://www.w3.org/2000/svg") {
      throw new Error(`invalid SVG: unsupported namespace for <${element.localName}>`);
    }
  }
}
