export abstract class Shape {
  private parentValue: Group | null = null;

  constructor(public readonly id: string, private readonly attributes: Map<string, string>) {}

  abstract readonly type: string;
  abstract summary(): string;

  get parent(): Group | null { return this.parentValue; }
  get attrs(): ReadonlyMap<string, string> { return this.attributes; }
  get(attribute: string): string | undefined { return this.attributes.get(attribute); }

  setParent(parent: Group | null): void { this.parentValue = parent; }
}

import { Group } from "./Group.js";
