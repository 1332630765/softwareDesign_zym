export class SvgDocument {
  constructor(private widthValue: number, private heightValue: number) {}

  get width(): number { return this.widthValue; }
  get height(): number { return this.heightValue; }

  resize(width: number, height: number): void {
    this.widthValue = width;
    this.heightValue = height;
  }

  dimensions(): string { return `${this.widthValue}x${this.heightValue}`; }
}
