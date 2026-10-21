import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { SvgEditor } from "../application/SvgEditor.js";
import { CommandDispatcher } from "./CommandDispatcher.js";

const dispatcher = new CommandDispatcher(new SvgEditor());
const input = createInterface({ input: stdin, output: stdout, prompt: "svg> " });
let closed = false;
input.on("close", () => { closed = true; });

console.log("svg-editor 0.1 — type 'help' for commands");
input.prompt();
input.on("line", line => {
  try {
    const result = dispatcher.dispatch(line);
    if (result) console.log(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`error: ${message.replace(/\s*\r?\n\s*/g, " ")}`);
  }
  if (!closed) input.prompt();
});
