export class NumberFormatter {
  static format(value: number): string {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
  }
}
