import { DOMParser, type Element } from "@xmldom/xmldom";
import { SvgDocument } from "../domain/SvgDocument.js";
import { Shape } from "../domain/Shape.js";
import { Group } from "../domain/Group.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";

export interface SvgParseResult {
  document: SvgDocument;
  warnings: string[];
}

export class SvgParser {
  private readonly supported = new Set(["g", "rect", "circle", "ellipse", "line", "text"]);
  private readonly coordinates = new Map<string, string[]>([
    ["rect", ["x", "y", "width", "height"]],
    ["circle", ["cx", "cy", "r"]],
    ["ellipse", ["cx", "cy", "rx", "ry"]],
    ["line", ["x1", "y1", "x2", "y2"]],
    ["text", ["x", "y"]]
  ]);

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

    const viewBox = root.getAttribute("viewBox")?.trim().split(/[\s,]+/);
    const width = this.number(root.getAttribute("width") ?? viewBox?.[2] ?? "800", "width");
    const height = this.number(root.getAttribute("height") ?? viewBox?.[3] ?? "600", "height");
    if (width <= 0 || height <= 0) throw new Error("invalid SVG: canvas size must be positive");
    const document = new SvgDocument(width, height);
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
      if (!this.supported.has(type)) throw new Error(`invalid SVG: unsupported element <${type}>`);
      const id = child.getAttribute("id");
      if (id) {
        if (ids.has(id)) throw new Error(`id already exists: ${id}`);
        ids.add(id);
      }
      if (type !== "text") this.collectIds(child, ids);
      else if (child.children.length > 0) throw new Error("invalid SVG: nested text elements are not supported");
    }
  }

  private appendChildren(element: Element, parent: Group, used: Set<string>,
    counters: Map<string, number>, warnings: string[]): void {
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
    }
  }

  private restoreShape(element: Element, type: string, id: string): Shape {
    const fields = this.coordinates.get(type) ?? [];
    const values = fields.map(name => this.number(element.getAttribute(name) ?? "0", name).toString());
    const optional = type === "line" ? element.getAttribute("stroke") : element.getAttribute("fill");
    const args = type === "text" ? [...values, element.textContent ?? ""]
      : type === "g" ? [] : [...values, ...(optional === null ? [] : [optional])];
    const shape = this.factory.create(type, id, args);
    for (let index = 0; index < element.attributes.length; index++) {
      const attribute = element.attributes.item(index)!;
      if (attribute.name === "id" || attribute.name === "xmlns" || attribute.name.startsWith("xmlns:")) continue;
      const value = fields.includes(attribute.name)
        ? this.number(attribute.value, attribute.name).toString() : attribute.value;
      if (attribute.name === "stroke-width") this.number(value, attribute.name);
      shape.importAttribute(attribute.name, value);
    }
    return shape;
  }

  private number(value: string, name: string): number {
    const normalized = value.trim().replace(/px$/i, "");
    const number = Number(normalized);
    if (!normalized || !Number.isFinite(number)) throw new Error(`invalid SVG: invalid ${name}: ${value}`);
    return number;
  }

  private checkNamespace(element: Element): void {
    if (element.namespaceURI && element.namespaceURI !== "http://www.w3.org/2000/svg") {
      throw new Error(`invalid SVG: unsupported namespace for <${element.localName}>`);
    }
  }
}
