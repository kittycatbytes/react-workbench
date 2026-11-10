import { useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";

type Row = { id: string; name: string; color: string };

const SEED: Row[] = [
  { id: "a", name: "Alpha", color: "#b8431f" },
  { id: "b", name: "Bravo", color: "#0c5c56" },
  { id: "c", name: "Charlie", color: "#1c4f8a" },
];

function copySeed(): Row[] {
  return SEED.map((row) => ({ ...row }));
}

function RowEditor({ row }: { row: Row }) {
  const [text, setText] = useState("");
  return (
    <label className="keys-row">
      <i style={{ background: row.color }} />
      <span>{row.name}</span>
      <input
        type="text"
        value={text}
        aria-label={`${row.name} notes`}
        placeholder="type, then reorder"
        onChange={(event) => setText(event.target.value)}
      />
    </label>
  );
}

function ListControls({
  tick,
  onReverse,
  onRotate,
  onNudge,
}: {
  tick: number;
  onReverse: () => void;
  onRotate: () => void;
  onNudge: () => void;
}) {
  return (
    <div className="row">
      <button type="button" onClick={onReverse}>
        Reverse
      </button>
      <button type="button" onClick={onRotate}>
        Move first to end
      </button>
      <button type="button" className="ghost" onClick={onNudge}>
        Nudge parent ({tick})
      </button>
    </div>
  );
}

function useRows() {
  const [rows, setRows] = useState(copySeed);
  const [tick, setTick] = useState(0);
  return {
    rows,
    tick,
    reverse: () => setRows((current) => [...current].reverse()),
    rotate: () =>
      setRows((current) =>
        current.length === 0 ? current : [...current.slice(1), current[0]],
      ),
    nudge: () => setTick((current) => current + 1),
  };
}

function StableKeys() {
  const list = useRows();
  return (
    <div className="widget stack">
      <ListControls
        tick={list.tick}
        onReverse={list.reverse}
        onRotate={list.rotate}
        onNudge={list.nudge}
      />
      {list.rows.map((row) => (
        <RowEditor key={row.id} row={row} />
      ))}
    </div>
  );
}

function IndexKeys({ repaired }: { repaired: boolean }) {
  const list = useRows();
  return (
    <div className="widget stack">
      <ListControls
        tick={list.tick}
        onReverse={list.reverse}
        onRotate={list.rotate}
        onNudge={list.nudge}
      />
      {list.rows.map((row, index) => (
        <RowEditor key={repaired ? row.id : index} row={row} />
      ))}
    </div>
  );
}

function RandomKeys({ repaired }: { repaired: boolean }) {
  const list = useRows();
  return (
    <div className="widget stack">
      <ListControls
        tick={list.tick}
        onReverse={list.reverse}
        onRotate={list.rotate}
        onNudge={list.nudge}
      />
      {list.rows.map((row) => (
        <RowEditor key={repaired ? row.id : Math.random()} row={row} />
      ))}
    </div>
  );
}

const stableCode = sample`
  {rows.map((row) => (
    <RowEditor key={row.id} row={row} />
  ))}
`;

const indexCode = sample`
  {rows.map((row, index) => (
    <RowEditor key={index} row={row} />
  ))}
`;

const randomCode = sample`
  {rows.map((row) => (
    <RowEditor key={Math.random()} row={row} />
  ))}
`;

export function KeysDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "index") return <IndexKeys repaired={repaired} />;
  if (scenarioId === "random") return <RandomKeys repaired={repaired} />;
  return <StableKeys />;
}

export const keysLesson: Lesson = {
  id: "keys",
  kicker: "reconciliation",
  title: "Keys decide identity",
  blurb: "React uses key to decide which component state survives a reorder.",
  Demo: KeysDemo,
  scenarios: [
    {
      id: "stable",
      label: "Key by id",
      tease: "The typed text stays with the named row.",
      tryThis: "Type in a row, then reverse the list.",
      code: stableCode.text,
      focus: [2],
      explanation: (
        <>
          <p>
            Each row is its own component with its own text state.{" "}
            <code>key={"row.id"}</code> tells React that Alpha is still Alpha after
            the reverse. React reuses that component, so the letters you typed stay
            with that name and that color.
          </p>
          <p>
            Reverse the list, then move the first row to the end. The text moves with
            the label. Nudge parent only re-renders the list. The keys are unchanged,
            so the text stays.
          </p>
        </>
      ),
    },
    {
      id: "index",
      label: "Key by index",
      tease: "The text sticks to the slot. The label moves without it.",
      tryThis: "Type in the top row, then reverse the list.",
      code: indexCode.text,
      focus: [2],
      explanation: (
        <>
          <p>
            <code>key={"index"}</code> tells React that the first slot is the
            identity, not Alpha. Reverse the list. React reuses the component
            instances in slot order, passes them new names and colors, and leaves
            their state alone.
          </p>
          <p>
            The labels swap. The text stays in the slot. That is the bug index keys
            create when a list can reorder, insert at the front, or filter. Nudge
            parent does not reorder, so the text survives that one.
          </p>
        </>
      ),
      repair: {
        code: stableCode.text,
        focus: stableCode.focus,
        tryThis: "Type in the top row, then reverse the list.",
        explanation: (
          <>
            <p>
              <code>key={"row.id"}</code> tells React that Alpha is still Alpha after
              the reverse. React reuses that component, so the letters you typed stay
              with that name.
            </p>
            <p>
              The broken version keyed the slot. The text stayed in the slot while the
              label moved. Keying the id is how the text follows the row.
            </p>
          </>
        ),
      },
    },
    {
      id: "random",
      label: "A new key every render",
      tease: "Any parent render throws the inputs away.",
      tryThis: "Type in a row, then nudge the parent. The order does not change.",
      code: randomCode.text,
      focus: [2],
      explanation: (
        <>
          <p>
            <code>key={"Math.random()"}</code> is a new identity every time this
            parent renders. React treats every row as brand new. It unmounts the old
            inputs and mounts new ones, and the text is gone.
          </p>
          <p>
            Nudge parent only increments a counter. The order does not change, and
            the inputs still wipe, because the keys did. Typing inside a row does not
            do this. That state update is in the row, so the parent does not render
            and the keys stay until the parent renders.
          </p>
        </>
      ),
      repair: {
        code: stableCode.text,
        focus: stableCode.focus,
        tryThis: "Type in a row, then nudge the parent.",
        explanation: (
          <>
            <p>
              <code>key={"row.id"}</code> is the same value on the next parent render.
              React reuses the inputs. Nudge the parent and the text you typed is
              still there.
            </p>
            <p>
              The broken version used <code>Math.random()</code>, so every parent
              render looked like a brand new list. A stable id is the fix.
            </p>
          </>
        ),
      },
    },
  ],
};
