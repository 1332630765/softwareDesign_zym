import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SvgEditor } from "../application/SvgEditor.js";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";

test("save/read round trip preserves hierarchy, style and escaped text", t => {
  const folder = mkdtempSync(join(tmpdir(), "svg-editor-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const file = join(folder, "diagram with spaces.svg");
  const writer = new CommandDispatcher(new SvgEditor());
  writer.dispatch("init 400 200");
  writer.dispatch("create g scene");
  writer.dispatch("create rect box 10 20 100 50 blue in scene");
  writer.dispatch('create text title 20 40 "A & <B>" in scene');
  writer.dispatch("create circle c1 50 60 10 red in scene");
  writer.dispatch("create ellipse e1 80 90 15 8 in scene");
  writer.dispatch("create line edge 0 0 100 100 black in scene");
  const before = writer.dispatch("tree");
  assert.equal(writer.dispatch(`save "${file}"`), `saved to ${file} (6 elements)`);
  assert.throws(() => writer.dispatch("undo"), /undo not allowed after io command/);
  const xml = readFileSync(file, "utf8");
  assert.match(xml, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="400" height="200"/);
  assert.match(xml, /A &amp; &lt;B&gt;/);
  const reader = new CommandDispatcher(new SvgEditor());
  assert.equal(reader.dispatch(`read "${file}"`), `read ${file} (6 elements)`);
  assert.equal(reader.dispatch("tree"), before);
  assert.throws(() => reader.dispatch("undo"), /undo not allowed after io command/);
  reader.dispatch("move box 10 0");
  assert.equal(reader.dispatch("save"), `saved to ${file} (6 elements)`);
  assert.match(readFileSync(file, "utf8"), /<rect id="box" x="20"/);
});

test("read assigns collision-free ids and retains supported and extra SVG attributes", t => {
  const folder = mkdtempSync(join(tmpdir(), "svg-editor-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const file = join(folder, "external.svg");
  const output = join(folder, "copy.svg");
  writeFileSync(file, '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="400px" height="300" viewBox="50 60 400 300" preserveAspectRatio="xMidYMid meet"><g id="scene" transform="translate(5,6)"><rect x="0" y="0" width="20" height="10" stroke-width="2"/><rect id="rect1" x="30" y="0" width="10" height="10"/><text x="1" y="2">A &amp; B</text></g></svg>');
  const cli = new CommandDispatcher(new SvgEditor());
  const feedback = cli.dispatch(`read "${file}"`);
  assert.match(feedback, /warning: assigned id rect2 to unnamed <rect>/);
  assert.match(feedback, /warning: assigned id text1 to unnamed <text>/);
  assert.match(cli.dispatch("tree"), /g#scene[\s\S]*rect#rect2[\s\S]*rect#rect1[\s\S]*text#text1.*A & B/);
  cli.dispatch(`save "${output}"`);
  const saved = readFileSync(output, "utf8");
  assert.match(saved, /transform="translate\(5,6\)"/);
  assert.match(saved, /stroke-width="2"/);
  assert.match(saved, /width="400" height="300" viewBox="50 60 400 300" preserveAspectRatio="xMidYMid meet"/);
});

test("failed read and save do not replace document or history", t => {
  const folder = mkdtempSync(join(tmpdir(), "svg-editor-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const invalid = join(folder, "invalid.svg");
  const malformed = join(folder, "malformed.svg");
  writeFileSync(invalid, '<svg><rect id="same"/><circle id="same"/></svg>');
  writeFileSync(malformed, '<svg><g><rect/></svg>');
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create rect keep 1 2 3 4");
  const before = cli.dispatch("tree");
  assert.throws(() => cli.dispatch(`read "${invalid}"`), /id already exists: same/);
  assert.throws(() => cli.dispatch(`read "${malformed}"`), /invalid SVG:/);
  assert.throws(() => cli.dispatch(`read "${join(folder, "missing.svg")}"`), /cannot read file:/);
  assert.throws(() => cli.dispatch(`save "${join(folder, "missing", "bad.svg")}"`), /cannot write file:/);
  assert.equal(cli.dispatch("tree"), before);
  cli.dispatch("undo");
  assert.doesNotMatch(cli.dispatch("tree"), /rect#keep/);
});

test("unsupported SVG elements are rejected instead of silently lost", t => {
  const folder = mkdtempSync(join(tmpdir(), "svg-editor-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const file = join(folder, "unsupported.svg");
  writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg"><path id="p" d="M0 0"/></svg>');
  const cli = new CommandDispatcher(new SvgEditor());
  assert.throws(() => cli.dispatch(`read "${file}"`), /invalid SVG: unsupported element <path>/);
  writeFileSync(file, '<svg><g id="g">unexpected text</g></svg>');
  assert.throws(() => cli.dispatch(`read "${file}"`), /unsupported text content in <g>/);
  writeFileSync(file, '<svg><rect id="r" width="10" height="10">unexpected text</rect></svg>');
  assert.throws(() => cli.dispatch(`read "${file}"`), /unsupported text content in <rect>/);
});

test("read rejects non-SVG numeric notation", t => {
  const folder = mkdtempSync(join(tmpdir(), "svg-editor-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const file = join(folder, "hex.svg");
  writeFileSync(file, '<svg width="400" height="200"><rect id="r" x="0x10" y="0" width="10" height="10"/></svg>');
  const cli = new CommandDispatcher(new SvgEditor());
  assert.throws(() => cli.dispatch(`read "${file}"`), /invalid SVG: invalid x: 0x10/);
  writeFileSync(file, '<svg width="400" height="200"><circle id="c" cx="0" cy="0" r="-1"/></svg>');
  assert.throws(() => cli.dispatch(`read "${file}"`), /invalid SVG: invalid r: -1/);
  writeFileSync(file, '<svg><rect id="bad id" width="10" height="10"/></svg>');
  assert.throws(() => cli.dispatch(`read "${file}"`), /invalid SVG: invalid id: bad id/);
});

test("save replaces an existing file and cleans temporary output on failure", t => {
  const folder = mkdtempSync(join(tmpdir(), "svg-editor-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const file = join(folder, "existing.svg");
  writeFileSync(file, "old content");
  const cli = new CommandDispatcher(new SvgEditor());
  cli.dispatch("init");
  cli.dispatch("create rect r 1 2 3 4");
  cli.dispatch(`save "${file}"`);
  assert.match(readFileSync(file, "utf8"), /<rect id="r"/);
  cli.dispatch("create circle c 1 2 3");
  assert.throws(() => cli.dispatch(`save "${folder}"`), /cannot write file:/);
  assert.deepEqual(readdirSync(folder), ["existing.svg"]);
  assert.doesNotMatch(readFileSync(file, "utf8"), /<circle id="c"/);
  cli.dispatch("undo");
  assert.doesNotMatch(cli.dispatch("tree"), /circle#c/);
});
