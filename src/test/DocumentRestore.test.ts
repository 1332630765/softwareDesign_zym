import test from "node:test";
import assert from "node:assert/strict";
import { Rect } from "../domain/Rect.js";
import { SvgDocument } from "../domain/SvgDocument.js";

test("a failing plugin clone leaves the live document untouched during restore", () => {
  const live = new SvgDocument(100, 100);
  live.root.add(new Rect("live", new Map([
    ["x", "0"], ["y", "0"], ["width", "10"], ["height", "10"]
  ])));
  const snapshot = new SvgDocument(200, 200);
  const broken = new Rect("broken", new Map([
    ["x", "1"], ["y", "1"], ["width", "1"], ["height", "1"]
  ]));
  broken.clone = () => { throw new Error("clone failed"); };
  snapshot.root.add(broken);

  assert.throws(() => live.restore(snapshot), /clone failed/);
  assert.equal(live.dimensions(), "100x100");
  assert.equal(live.find("live")?.id, "live");
  assert.equal(live.find("broken"), undefined);
});
