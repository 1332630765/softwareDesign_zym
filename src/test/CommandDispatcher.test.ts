import test from "node:test";
import assert from "node:assert/strict";
import { SvgEditor } from "../application/SvgEditor.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";

test("create and resize a canvas", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  assert.equal(cli.dispatch("init"), "canvas 800x600 created");
  assert.equal(cli.dispatch("canvas"), "canvas 800x600");
  assert.equal(cli.dispatch("canvas 400 200"), "canvas resized to 400x200");
  assert.equal(cli.dispatch("canvas"), "canvas 400x200");
});

test("invalid input does not change canvas", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  assert.throws(() => cli.dispatch("canvas"), /no document/);
  cli.dispatch("init 300 150");
  assert.throws(() => cli.dispatch("canvas 0 200"), /positive/);
  assert.throws(() => cli.dispatch("canvas 200"), /usage/);
  assert.equal(cli.dispatch("canvas"), "canvas 300x150");
  assert.equal(cli.dispatch("# comment"), "");
});
