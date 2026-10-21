import test from "node:test";
import assert from "node:assert/strict";
import { CommandHistory } from "../application/CommandHistory.js";
import { SnapshotCommand } from "../application/SnapshotCommand.js";
import { Rect } from "../domain/Rect.js";
import { SvgDocument } from "../domain/SvgDocument.js";

test("failed undo and redo keep the command on its original history stack", () => {
  const history = new CommandHistory();
  let value = 0;
  let failUndo = true;
  let failRedo = true;
  history.execute({
    execute: () => { value = 1; return "done"; },
    undo: () => {
      if (failUndo) throw new Error("undo failed");
      value = 0;
      return "undone";
    },
    redo: () => {
      if (failRedo) throw new Error("redo failed");
      value = 1;
      return "redone";
    }
  });

  assert.throws(() => history.undo(), /undo failed/);
  assert.equal(value, 1);
  failUndo = false;
  assert.equal(history.undo(), "undone");
  assert.equal(value, 0);
  assert.throws(() => history.redo(), /redo failed/);
  assert.equal(value, 0);
  failRedo = false;
  assert.equal(history.redo(), "redone");
  assert.equal(value, 1);
});

test("failed execute does not discard an existing redo command", () => {
  const history = new CommandHistory();
  history.execute({ execute: () => "first", undo: () => "undone", redo: () => "redone" });
  history.undo();
  assert.throws(() => history.execute({
    execute: () => { throw new Error("execute failed"); },
    undo: () => "unused",
    redo: () => "unused"
  }), /execute failed/);
  assert.equal(history.redo(), "redone");
});

test("a snapshot undo can be retried after a transient clone failure", () => {
  const document = new SvgDocument(100, 100);
  const shape = new Rect("r", new Map([
    ["x", "0"], ["y", "0"], ["width", "10"], ["height", "10"]
  ]));
  let clones = 0;
  const cloneFrom = (source: Rect): (() => Rect) => () => {
    if (++clones === 3) throw new Error("transient clone failure");
    const copy = new Rect(source.id, new Map(source.attrs));
    copy.clone = cloneFrom(copy);
    return copy;
  };
  shape.clone = cloneFrom(shape);
  document.root.add(shape);
  const history = new CommandHistory();
  history.execute(new SnapshotCommand(document,
    () => { shape.set("fill", "blue"); return "updated"; }, "restored", "updated"));

  assert.throws(() => history.undo(), /transient clone failure/);
  assert.equal(document.find("r")?.get("fill"), "blue");
  assert.equal(history.undo(), "restored");
  assert.equal(document.find("r")?.get("fill"), undefined);
});
