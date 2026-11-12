import { useState } from "react";
import { sample } from "../workbench/sample.ts";
import { JsApi } from "../workbench/JsApi.tsx";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { CountStepper } from "../workbench/bits.tsx";

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
  views,
  onReverse,
  onRotate,
  onViews,
}: {
  views: number;
  onReverse: () => void;
  onRotate: () => void;
  onViews: (next: number) => void;
}) {
  return (
    <div className="row">
      <button type="button" onClick={onReverse}>
        Reverse
      </button>
      <button type="button" onClick={onRotate}>
        Move first to end
      </button>
      <CountStepper label="Times viewed" value={views} onChange={onViews} />
    </div>
  );
}

function useRows() {
  const [rows, setRows] = useState(copySeed);
  const [views, setViews] = useState(1);
  return {
    rows,
    views,
    reverse: () => setRows((current) => [...current].reverse()),
    rotate: () =>
      setRows((current) =>
        current.length === 0 ? current : [...current.slice(1), current[0]],
      ),
    setViews,
  };
}

function StableKeys() {
  const list = useRows();
  return (
    <div className="widget stack">
      <ListControls
        views={list.views}
        onReverse={list.reverse}
        onRotate={list.rotate}
        onViews={list.setViews}
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
        views={list.views}
        onReverse={list.reverse}
        onRotate={list.rotate}
        onViews={list.setViews}
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
        views={list.views}
        onReverse={list.reverse}
        onRotate={list.rotate}
        onViews={list.setViews}
      />
      {list.rows.map((row) => (
        <RowEditor key={repaired ? row.id : Math.random()} row={row} />
      ))}
    </div>
  );
}

const stableCode = sample`
  <>
    <button onClick={reverse}>Reverse</button> //reverse defined off-screen
    <button onClick={rotate}>Move first to end</button> //rotate defined off-screen
    <p>Times viewed {views}</p> //views defined off-screen
    <button onClick={() => setViews((value) => Math.max(1, value - 1))}>-</button> //setViews defined off-screen
    <button onClick={() => setViews((value) => value + 1)}>+</button>
    {rows.map((row) => ( //rows defined off-screen
      <RowEditor key={row.id} row={row} /> //RowEditor defined off-screen /*focus*/
    ))}
  </>
`;

const indexCode = sample`
  <>
    <button onClick={reverse}>Reverse</button> //reverse defined off-screen
    <button onClick={rotate}>Move first to end</button> //rotate defined off-screen
    <p>Times viewed {views}</p> //views defined off-screen
    <button onClick={() => setViews((value) => Math.max(1, value - 1))}>-</button> //setViews defined off-screen
    <button onClick={() => setViews((value) => value + 1)}>+</button>
    {rows.map((row, index) => ( //rows defined off-screen
      <RowEditor key={index} row={row} /> //RowEditor defined off-screen /*focus*/
    ))}
  </>
`;

const randomCode = sample`
  <>
    <button onClick={reverse}>Reverse</button> //reverse defined off-screen
    <button onClick={rotate}>Move first to end</button> //rotate defined off-screen
    <p>Times viewed {views}</p> //views defined off-screen
    <button onClick={() => setViews((value) => Math.max(1, value - 1))}>-</button> //setViews defined off-screen
    <button onClick={() => setViews((value) => value + 1)}>+</button>
    {rows.map((row) => ( //rows defined off-screen
      <RowEditor key={Math.random()} row={row} /> //RowEditor defined off-screen /*focus*/
    ))}
  </>
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
      focus: stableCode.focus,
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
            the label. Changing times viewed only re-renders the list. The keys are
            unchanged, so the text stays.
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
      focus: indexCode.focus,
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
            create when a list can reorder, insert at the front, or filter. Changing
            times viewed does not reorder, so the text survives that one.
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
      tryThis: "Type in a row, then change times viewed. The order does not change.",
      code: randomCode.text,
      focus: randomCode.focus,
      explanation: (
        <>
          <p>
            <JsApi name="Math.random()" n={1}>{"key={Math.random()}"}</JsApi> is a new identity every time this
            parent renders. React treats every row as brand new. It unmounts the old
            inputs and mounts new ones, and the text is gone.
          </p>
          <p>
            Changing times viewed only updates a counter. The order does not change,
            and the inputs still wipe, because the keys did. Typing inside a row does not
            do this. That state update is in the row, so the parent does not render
            and the keys stay until the parent renders.
          </p>
        </>
      ),
      repair: {
        code: stableCode.text,
        focus: stableCode.focus,
        tryThis: "Type in a row, then change times viewed.",
        explanation: (
          <>
            <p>
              <code>key={"row.id"}</code> is the same value on the next parent render.
              React reuses the inputs. Change times viewed and the text you typed is
              still there.
            </p>
            <p>
              The broken version used <JsApi name="Math.random()" n={1} />, so every parent
              render looked like a brand new list. A stable id is the fix.
            </p>
          </>
        ),
      },
    },
  ],
};
