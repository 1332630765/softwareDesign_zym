export class NumberFormatter {
  private static readonly nonNegative = new Set(["width", "height", "r", "rx", "ry", "stroke-width"]);

  static isNumber(value: string): boolean {
    const normalized = value.trim();
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)
      && Number.isFinite(Number(normalized));
  }

  static isGeometryValue(name: string, value: string): boolean {
    return this.isNumber(value) && (!this.nonNegative.has(name) || Number(value) >= 0);
  }

  static format(value: number): string {
    if (!Number.isFinite(value)) throw new Error("geometry value out of range");
    return String(value);
  }
}
