import test from "node:test";
import assert from "node:assert/strict";
import { SvgEditor } from "../application/SvgEditor.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";

test("create all built-in shapes and display nested structure", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init 400 200");
  cli.dispatch("create g scene");
  cli.dispatch("create rect r1 10 20 100 50 blue in scene");
  cli.dispatch("create circle c1 50 50 10 red in scene");
  cli.dispatch("create ellipse e1 80 60 12 8 in scene");
  cli.dispatch("create line l1 0 0 100 100 black in scene");
  cli.dispatch('create text t1 20 40 "Hello SVG" in scene');
  const tree = cli.dispatch("tree");
  assert.match(tree, /svg \(400x200\)[\s\S]*g#scene/);
  assert.match(tree, /rect#r1.*w=100 h=50 fill=blue/);
  assert.match(tree, /circle#c1.*r=10 fill=red/);
  assert.match(tree, /ellipse#e1.*rx=12 ry=8/);
  assert.match(tree, /line#l1.*stroke=black/);
  assert.match(tree, /text#t1.*"Hello SVG"/);
  assert.match(cli.dispatch("show t1"), /parent=g#scene[\s\S]*text="Hello SVG"/);
  assert.doesNotMatch(cli.dispatch("tree c1"), /rect#r1/);
});

test("create validates ids, types, parameters and container before mutation", () => {
  const cli = new CommandDispatcher(new SvgEditor());
  assert.throws(() => cli.dispatch("create g orphan"), /no document/);
  cli.dispatch("init");
  cli.dispatch("create rect r1 0 0 10 10");
  const before = cli.dispatch("tree");
  assert.throws(() => cli.dispatch("create circle r1 1 1 2"), /id already exists: r1/);
  assert.throws(() => cli.dispatch("create hexagon h1"), /unknown shape type: hexagon/);
  assert.throws(() => cli.dispatch("create circle c1 1 1 nope"), /invalid number: nope/);
  assert.throws(() => cli.dispatch("create g g1 in missing"), /no such container: missing/);
  assert.throws(() => cli.dispatch("create g g1 in r1"), /not a container: r1/);
  assert.throws(() => cli.dispatch('create text t1 1 2 "unterminated'), /unterminated quote/);
  assert.equal(cli.dispatch("tree"), before);
});
