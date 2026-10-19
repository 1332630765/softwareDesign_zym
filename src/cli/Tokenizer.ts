export class Tokenizer {
  tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let quoted = false;
    let started = false;

    for (const character of line) {
      if (character === '"') {
        quoted = !quoted;
        started = true;
      } else if (/\s/.test(character) && !quoted) {
        if (started) tokens.push(current);
        current = "";
        started = false;
      } else {
        current += character;
        started = true;
      }
    }
    if (quoted) throw new Error("unterminated quote");
    if (started) tokens.push(current);
    return tokens;
  }
}
