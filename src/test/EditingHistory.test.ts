import test from "node:test";
import assert from "node:assert/strict";
import { SvgEditor } from "../application/SvgEditor.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";

test("group edits are one undo unit and transforms reach nested leaves", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create rect r 10 20 30 40 blue");
  cli.dispatch('create text t 15 35 "Label"');
  cli.dispatch("group node r t");
  assert.match(cli.dispatch("tree"), /g#node[\s\S]*rect#r[\s\S]*text#t/);
  cli.dispatch("move node 5 10");
  assert.match(cli.dispatch("show r"), /x=15 y=30/);
  assert.match(cli.dispatch("show t"), /x=20 y=45/);
  cli.dispatch("scale node 2");
  assert.match(cli.dispatch("show r"), /x=30 y=60 width=60 height=80/);
  cli.dispatch("undo");
  assert.match(cli.dispatch("show r"), /x=15 y=30 width=30 height=40/);
  cli.dispatch("undo");
  assert.match(cli.dispatch("show t"), /x=15 y=35/);
  cli.dispatch("undo");
  assert.doesNotMatch(cli.dispatch("tree"), /g#node/);
  assert.match(cli.dispatch("tree"), /rect#r[\s\S]*text#t/);
  cli.dispatch("redo");
  assert.match(cli.dispatch("tree"), /g#node[\s\S]*rect#r[\s\S]*text#t/);
});

test("set, delete, z-order, addto and ungroup preserve structure across undo", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create g outer");
  cli.dispatch("create g inner in outer");
  cli.dispatch("create rect a 1 2 3 4");
  cli.dispatch("create circle b 5 6 7 in inner");
  cli.dispatch("addto inner a");
  cli.dispatch("back a");
  assert.ok(cli.dispatch("tree inner").indexOf("rect#a") < cli.dispatch("tree inner").indexOf("circle#b"));
  cli.dispatch("set a fill red");
  assert.match(cli.dispatch("show a"), /fill=red/);
  cli.dispatch("delete b");
  assert.doesNotMatch(cli.dispatch("tree"), /circle#b/);
  cli.dispatch("undo");
  assert.match(cli.dispatch("tree"), /circle#b/);
  cli.dispatch("ungroup inner");
  assert.doesNotMatch(cli.dispatch("tree outer"), /g#inner/);
  assert.match(cli.dispatch("tree outer"), /rect#a[\s\S]*circle#b/);
  cli.dispatch("undo");
  assert.match(cli.dispatch("tree outer"), /g#inner[\s\S]*rect#a[\s\S]*circle#b/);
});

test("invalid edits leave tree and history unchanged", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create g parent");
  cli.dispatch("create g child in parent");
  cli.dispatch("create rect r 0 0 10 10 in child");
  const before = cli.dispatch("tree");
  assert.throws(() => cli.dispatch("group bad parent child"), /cannot group a container into its own descendant: parent/);
  assert.throws(() => cli.dispatch("addto child parent"), /cannot add a container into its own descendant: parent/);
  assert.throws(() => cli.dispatch("ungroup parent"), /cannot ungroup top-level container: parent/);
  assert.throws(() => cli.dispatch("scale r 0"), /scale factor must be positive/);
  assert.throws(() => cli.dispatch("set r bogus value"), /unknown attribute: bogus/);
  assert.throws(() => cli.dispatch("set r x nope"), /invalid number: nope/);
  assert.equal(cli.dispatch("tree"), before);
  cli.dispatch("undo");
  assert.doesNotMatch(cli.dispatch("tree"), /rect#r/);
});

test("redo clears after a new edit and I/O style commands lock history", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  assert.throws(() => cli.dispatch("undo"), /no document/);
  cli.dispatch("init");
  assert.throws(() => cli.dispatch("undo"), /undo not allowed after io command/);
  cli.dispatch("create circle c 1 2 3");
  cli.dispatch("move c 1 1");
  cli.dispatch("undo");
  cli.dispatch("set c fill blue");
  assert.throws(() => cli.dispatch("redo"), /nothing to redo/);
  cli.dispatch("canvas 400 300");
  assert.throws(() => cli.dispatch("undo"), /undo not allowed after io command/);
  cli.dispatch("create g fresh");
  cli.dispatch("undo");
  assert.doesNotMatch(cli.dispatch("tree"), /g#fresh/);
});

test("each leaf shape uses its own geometry when moved and scaled", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create circle c 10 20 3");
  cli.dispatch("create ellipse e 10 20 3 4");
  cli.dispatch("create line l 1 2 3 4");
  cli.dispatch("move c 5 -5");
  cli.dispatch("scale c 2");
  assert.match(cli.dispatch("show c"), /cx=30 cy=30 r=6/);
  cli.dispatch("move e 5 -5");
  cli.dispatch("scale e 2");
  assert.match(cli.dispatch("show e"), /cx=30 cy=30 rx=6 ry=8/);
  cli.dispatch("move l 5 -5");
  cli.dispatch("scale l 2");
  assert.match(cli.dispatch("show l"), /x1=12 y1=-6 x2=16 y2=-2/);
});

test("group collects shapes from different parents in document order and undoes atomically", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create g left");
  cli.dispatch("create rect a 0 0 1 1 in left");
  cli.dispatch("create rect b 1 0 1 1");
  cli.dispatch("create g right");
  cli.dispatch("create circle c 2 0 1 in right");
  const before = cli.dispatch("tree");
  cli.dispatch("group collected c b a");
  const grouped = cli.dispatch("tree collected");
  assert.ok(grouped.indexOf("rect#a") < grouped.indexOf("rect#b"));
  assert.ok(grouped.indexOf("rect#b") < grouped.indexOf("circle#c"));
  cli.dispatch("undo");
  assert.equal(cli.dispatch("tree"), before);
});

test("editing after init replaces the old document and keeps undo on the new one", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init 100 100");
  cli.dispatch("create rect old 0 0 10 10");
  cli.dispatch("init 200 200");
  cli.dispatch("create circle fresh 20 20 5");
  assert.doesNotMatch(cli.dispatch("tree"), /rect#old/);
  assert.match(cli.dispatch("tree"), /circle#fresh/);
  cli.dispatch("undo");
  assert.equal(cli.dispatch("tree"), "svg (200x200)");
});
