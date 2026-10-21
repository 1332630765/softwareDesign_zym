import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SvgEditor } from "../application/SvgEditor.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { BadgeProvider } from "./fixtures/BadgeProvider.js";

test("a registered composite provider creates, edits and round-trips through SVG", () => {
  const factory = new ShapeFactory();
  factory.register(new BadgeProvider());
  assert.throws(() => factory.register(new BadgeProvider()), /already registered/);
  const cli = new CommandDispatcher(new SvgEditor(factory));
  const folder = mkdtempSync(join(tmpdir(), "svg-provider-"));
  const file = join(folder, "badge.svg");
  try {
    cli.dispatch("init 100 100");
    assert.equal(cli.dispatch("create badge b1"), "badge#b1 created");
    cli.dispatch("move b1 5 6");
    assert.match(cli.dispatch("show b1-rect"), /x=5 y=6/);
    cli.dispatch("undo");
    assert.match(cli.dispatch("show b1-rect"), /x=0 y=0/);
    assert.throws(() => cli.dispatch("ungroup b1"), /cannot ungroup composite shape: b1/);
    cli.dispatch(`save "${file}"`);
    assert.match(readFileSync(file, "utf8"), /<g id="b1" data-kind="badge">/);
    cli.dispatch(`read "${file}"`);
    assert.match(cli.dispatch("tree"), /g#b1 \(badge\)[\s\S]*rect#b1-rect/);
    assert.match(cli.dispatch("show b1"), /g#b1 \(badge\)  parent=svg/);

    const withoutPlugin = new CommandDispatcher(new SvgEditor());
    withoutPlugin.dispatch(`read "${file}"`);
    assert.match(withoutPlugin.dispatch("tree"), /g#b1[\s\S]*rect#b1-rect/);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("generated child ids are validated before a provider shape is added", () => {
  const factory = new ShapeFactory();
  factory.register(new BadgeProvider());
  const cli = new CommandDispatcher(new SvgEditor(factory));
  cli.dispatch("init");
  cli.dispatch("create rect b1-rect 0 0 1 1");
  const before = cli.dispatch("tree");
  assert.throws(() => cli.dispatch("create badge b1"), /id already exists: b1-rect/);
  assert.equal(cli.dispatch("tree"), before);
  cli.dispatch("undo");
  assert.equal(cli.dispatch("tree"), "svg (800x600)");
});
