import { Group } from "../../domain/Group.js";

/** Test-only composite; the Phase 1 application still does not provide box. */
export class Badge extends Group {
  override readonly type = "badge";
  override get svgTag(): string { return "g"; }
  override get isComposite(): boolean { return true; }

  constructor(id: string, attributes = new Map<string, string>([["data-kind", "badge"]])) {
    super(id, attributes);
  }

  override clone(): Badge {
    const copy = new Badge(this.id, new Map(this.attrs));
    for (const child of this.children) copy.add(child.clone());
    return copy;
  }
}
