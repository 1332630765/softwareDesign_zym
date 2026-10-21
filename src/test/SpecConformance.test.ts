import test from "node:test";
import assert from "node:assert/strict";
import { SvgEditor } from "../application/SvgEditor.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";

test("front/back, text updates, group style and case-sensitive ids", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create g scene");
  cli.dispatch("create rect a 0 0 10 10 in scene");
  cli.dispatch("create rect A 10 0 10 10 in scene");
  cli.dispatch('create text label 0 20 "old text" in scene');
  cli.dispatch("front a");
  assert.ok(cli.dispatch("tree scene").indexOf("rect#A") < cli.dispatch("tree scene").indexOf("rect#a"));
  cli.dispatch("back a");
  assert.ok(cli.dispatch("tree scene").indexOf("rect#a") < cli.dispatch("tree scene").indexOf("rect#A"));
  cli.dispatch("set scene fill blue");
  assert.match(cli.dispatch("show scene"), /fill=blue/);
  cli.dispatch('set label text "new text"');
  assert.match(cli.dispatch("tree"), /"new text"/);
  cli.dispatch("undo");
  assert.match(cli.dispatch("tree"), /"old text"/);
  assert.throws(() => cli.dispatch('create box node 0 0 10 10 "title"'), /unknown shape type: box/);
  assert.match(cli.dispatch("help"), /read <file.svg>.*save \[file.svg\]/);
  assert.match(cli.dispatch("help"), /create ellipse <id> <cx> <cy> <rx> <ry>/);
});

test("show presents geometry and style on separate detail lines", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create circle c1 100 100 20 red");
  assert.equal(cli.dispatch("show c1"), "circle#c1  parent=svg\n  cx=100 cy=100 r=20\n  fill=red");
});

test("literal in remains valid text content without a container suffix", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch('create text t 1 2 "in"');
  assert.match(cli.dispatch("tree"), /text#t.*"in"/);
  cli.dispatch("create g scene");
  cli.dispatch('create text t2 3 4 "in" in scene');
  assert.match(cli.dispatch("tree scene"), /text#t2.*"in"/);
});

test("small valid floating-point transforms do not round geometry to zero", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create circle tiny 1 2 1");
  cli.dispatch("scale tiny 0.000000000001");
  assert.match(cli.dispatch("show tiny"), /cx=1e-12 cy=2e-12 r=1e-12/);
});

test("empty numeric arguments and overflowing transforms fail without changing the document", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create circle c 1e308 2 3");
  const before = cli.dispatch("tree");
  assert.throws(() => cli.dispatch('create rect bad "" 0 10 10'), /invalid number:/);
  assert.throws(() => cli.dispatch('set c cx ""'), /invalid number:/);
  assert.throws(() => cli.dispatch('move c "" 1'), /invalid number:/);
  assert.throws(() => cli.dispatch("move c 0x10 1"), /invalid number: 0x10/);
  assert.throws(() => cli.dispatch("create rect hex 0x10 0 10 10"), /invalid number: 0x10/);
  assert.throws(() => cli.dispatch("set c cx 0x10"), /invalid number: 0x10/);
  assert.throws(() => cli.dispatch("create rect negative 0 0 -10 20"), /invalid number: -10/);
  assert.throws(() => cli.dispatch("set c r -1"), /invalid number: -1/);
  assert.throws(() => cli.dispatch("set c stroke-width -1"), /invalid number: -1/);
  assert.throws(() => cli.dispatch('create g "bad id"'), /invalid id: bad id/);
  assert.throws(() => cli.dispatch("scale c 2"), /geometry value out of range/);
  assert.equal(cli.dispatch("tree"), before);
  cli.dispatch("undo");
  assert.doesNotMatch(cli.dispatch("tree"), /circle#c/);
});

test("a failed group transform rolls back earlier child changes", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create g scene");
  cli.dispatch("create rect first 1 2 3 4 in scene");
  cli.dispatch("create circle last 1e308 2 3 in scene");
  const before = cli.dispatch("tree");
  assert.throws(() => cli.dispatch("scale scene 2"), /geometry value out of range/);
  assert.equal(cli.dispatch("tree"), before);
  cli.dispatch("undo");
  assert.doesNotMatch(cli.dispatch("tree"), /circle#last/);
});
