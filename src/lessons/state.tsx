import { useEffect, useRef, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { RenderMark } from "../workbench/bits.tsx";

function useTimers() {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const ids = timers.current;
    return () => {
      for (const id of ids) window.clearTimeout(id);
    };
  }, []);
  return (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };
}

function SnapshotCounter() {
  const [count, setCount] = useState(0);
  const later = useTimers();
  return (
    <div className="widget stack">
      <RenderMark name="counter" />
      <p className="figure" data-testid="count">{count}</p>
      <div className="row">
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          +1 now
        </button>
        <button
          type="button"
          onClick={() => later(() => setCount((value) => value + 1), 600)}
        >
          +1 in 600ms
        </button>
      </div>
    </div>
  );
}

function StaleCounter({ repaired }: { repaired: boolean }) {
  const [count, setCount] = useState(0);
  const [notes, setNotes] = useState<string[]>([]);
  const later = useTimers();
  return (
    <div className="widget stack">
      <RenderMark name="counter" />
      <p className="figure" data-testid="count">{count}</p>
      <button
        type="button"
        onClick={() => {
          if (repaired) {
            setNotes((current) => ["Timer reads the latest count", ...current].slice(0, 4));
            later(() => setCount((value) => value + 1), 600);
            return;
          }
          setNotes((current) => [`Timer closed over ${count}`, ...current].slice(0, 4));
          later(() => setCount(count + 1), 600);
        }}
      >
        +1 in 600ms
      </button>
      <ul className="matches" data-testid="notes">
        {notes.map((note, index) => (
          <li key={`${index}:${note}`}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

function MutationCounter({ repaired }: { repaired: boolean }) {
  const [profile, setProfile] = useState({ name: "Ada" });
  const [tick, setTick] = useState(0);
  return (
    <div className="widget stack">
      <RenderMark name="counter" />
      <p className="readout">
        Screen says <strong data-testid="name">{profile.name}</strong>
      </p>
      {repaired ? null : <p className="hint">Unrelated renders: {tick}</p>}
      <div className="row">
        <button
          type="button"
          onClick={() => {
            if (repaired) {
              setProfile({ name: "Grace" });
              return;
            }
            profile.name = "Grace";
          }}
        >
          {repaired ? "Set name to Grace" : "Mutate name to Grace"}
        </button>
        {repaired ? null : (
          <>
            <button type="button" onClick={() => setTick((value) => value + 1)}>
              Unrelated render
            </button>
            <button type="button" className="ghost" onClick={() => setProfile({ name: "Grace" })}>
              Replace state
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BatchCounter() {
  const [count, setCount] = useState(0);
  const [note, setNote] = useState("Neither button has been pressed.");
  return (
    <div className="widget stack">
      <RenderMark name="counter" />
      <p className="figure" data-testid="count">{count}</p>
      <div className="row">
        <button
          type="button"
          onClick={() => {
            setCount(count + 1);
            setCount(count + 1);
            setCount(count + 1);
            setNote("Three writes of the same snapshot. The last one wins.");
          }}
        >
          Same snapshot ×3
        </button>
        <button
          type="button"
          onClick={() => {
            setCount((value) => value + 1);
            setCount((value) => value + 1);
            setCount((value) => value + 1);
            setNote("Each function receives the result of the previous one.");
          }}
        >
          Chained updates ×3
        </button>
      </div>
      <p className="hint" data-testid="note">{note}</p>
    </div>
  );
}

const snapshot = sample`
  function SnapshotCounter() {
    const [count, setCount] = useState(0);
    return (
      <>
        <p>{count}</p>
        <button onClick={() => setCount((value) => value + 1)}>+1 now</button>
        <button
          onClick={() => {
            setTimeout(() => setCount((value) => value + 1), 600); /*focus*/
          }}
        >
          +1 in 600ms
        </button>
      </>
    );
  }
`;

const stale = sample`
  function StaleCounter() {
    const [count, setCount] = useState(0);
    return (
      <button
        onClick={() => {
          setTimeout(() => setCount(count + 1), 600); /*focus*/
        }}
      >
        +1 in 600ms
      </button>
    );
  }
`;

const mutation = sample`
  function MutationCounter() {
    const [profile, setProfile] = useState({ name: "Ada" });
    const [tick, setTick] = useState(0);
    return (
      <>
        <p>Screen says {profile.name}</p>
        <p>Unrelated renders: {tick}</p>
        <button
          onClick={() => {
            profile.name = "Grace"; /*focus*/
          }}
        >
          Mutate name to Grace
        </button>
        <button onClick={() => setTick((value) => value + 1)}>
          Unrelated render
        </button>
        <button onClick={() => setProfile({ name: "Grace" })}> /*focus*/
          Replace state
        </button>
      </>
    );
  }
`;

const batch = sample`
  function BatchCounter() {
    const [count, setCount] = useState(0);
    const [note, setNote] = useState("Neither button has been pressed.");
    return (
      <>
        <button
          onClick={() => {
            setCount(count + 1); /*focus*/
            setCount(count + 1); /*focus*/
            setCount(count + 1); /*focus*/
          }}
        >
          Same snapshot ×3
        </button>
        <button
          onClick={() => {
            setCount((value) => value + 1); /*focus*/
            setCount((value) => value + 1); /*focus*/
            setCount((value) => value + 1); /*focus*/
          }}
        >
          Chained updates ×3
        </button>
        <p>{note}</p>
      </>
    );
  }
`;

const staleFixed = sample`
  function StaleCounter() {
    const [count, setCount] = useState(0);
    const later = useTimers();
    return (
      <button
        onClick={() => {
          later(() => setCount((value) => value + 1), 600); /*focus*/
        }}
      >
        +1 in 600ms
      </button>
    );
  }
`;

const mutationFixed = sample`
  function MutationCounter() {
    const [profile, setProfile] = useState({ name: "Ada" });
    return (
      <>
        <p>Screen says {profile.name}</p>
        <button onClick={() => setProfile({ name: "Grace" })}> /*focus*/
          Set name to Grace
        </button>
      </>
    );
  }
`;

export function StateDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "stale") return <StaleCounter repaired={repaired} />;
  if (scenarioId === "mutate") return <MutationCounter repaired={repaired} />;
  if (scenarioId === "batch") return <BatchCounter />;
  return <SnapshotCounter />;
}

export const stateLesson: Lesson = {
  id: "state",
  kicker: "useState",
  title: "State is a snapshot",
  blurb:
    "A render closes over the state it was given. An update asks React to render again.",
  Demo: StateDemo,
  scenarios: [
    {
      id: "snapshot",
      label: "Functional updates",
      tease: "The updater runs later, against the newest count.",
      tryThis: 'Click "+1 in 600ms" three times before the number moves.',
      code: snapshot.text,
      focus: snapshot.focus,
      explanation: (
        <>
          <p>
            <code>count</code> is a const from this render. Clicking does not change it.
            It asks React to render again with the next number.
          </p>
          <p>
            The delayed button closes over nothing from this render.{" "}
            <code>{"(value) => value + 1"}</code> runs when the timer fires, and React
            passes it the latest count. Three quick clicks land on 3.
          </p>
          <p>The "+1 now" button is the same updater, applied on the click.</p>
        </>
      ),
    },
    {
      id: "stale",
      label: "Stale closure",
      tease: "The timer keeps the count from the click that scheduled it.",
      tryThis: 'Click "+1 in 600ms" three times while the number still shows 0.',
      code: stale.text,
      focus: stale.focus,
      explanation: (
        <>
          <p>
            The click handler reads <code>count</code> from the render that created it.
            The timer keeps that number.
          </p>
          <p>
            Click three times while the stage still shows 0. Three timers each call{" "}
            <code>setCount(0 + 1)</code>. They all write 1. The stage shows 1, and the
            chips all say the timer closed over 0.
          </p>
          <p>
            The functional form in the first scenario never reads <code>count</code>{" "}
            from the click. It receives the newest value when React applies the update.
          </p>
        </>
      ),
      repair: {
        code: staleFixed.text,
        focus: staleFixed.focus,
        tryThis: 'Click "+1 in 600ms" three times while the number still shows 0.',
        explanation: (
          <>
            <p>
              The timer calls <code>{"setCount((value) => value + 1)"}</code>. It does
              not read <code>count</code> from the click. When it fires, React passes
              it the latest count and returns the next one.
            </p>
            <p>
              Click three times while the stage still shows 0. The three updates chain.
              The stage lands on 3.
            </p>
          </>
        ),
      },
    },
    {
      id: "mutate",
      label: "Mutate the object",
      tease: "Editing the object does not schedule a render.",
      tryThis: "Mutate the name, then press Unrelated render.",
      code: mutation.text,
      focus: mutation.focus,
      explanation: (
        <>
          <p>
            <code>profile</code> is the object from the last render.{" "}
            <code>profile.name = "Grace"</code> edits that object and does not ask for
            a new render, so the stage keeps painting Ada.
          </p>
          <p>
            Unrelated render calls <code>setTick</code>. React renders again, reads{" "}
            <code>profile.name</code>, and now the screen says Grace. You never passed
            a new object to <code>setProfile</code>. The mutation was sitting in the
            old object. The next render noticed.
          </p>
          <p>
            Replace state passes a new object. That is an update React can track.
          </p>
        </>
      ),
      repair: {
        code: mutationFixed.text,
        focus: mutationFixed.focus,
        tryThis: "Press Set name to Grace.",
        explanation: (
          <>
            <p>
              The click calls <code>{"setProfile({ name: \"Grace\" })"}</code>. That
              passes a new object. React renders, and the screen says Grace on that
              click.
            </p>
            <p>
              The broken version edited the object React was already holding and never
              asked for a render. Replacing the object is the update React can track.
            </p>
          </>
        ),
      },
    },
    {
      id: "batch",
      label: "Same snapshot, three times",
      tease: "Three writes of count + 1 still move the number by one.",
      tryThis: "Press each ×3 button once and compare the number.",
      code: batch.text,
      focus: batch.focus,
      explanation: (
        <>
          <p>
            All three <code>setCount(count + 1)</code> lines read the same{" "}
            <code>count</code>. If the stage shows 4, each line schedules 5. React
            renders once and keeps the last update, so the stage moves by one.
          </p>
          <p>
            The chained button is a different kind of update. Each function receives
            the result of the previous one, so the same click adds 3.
          </p>
          <p>
            Batching is why either button renders once. The snapshot is why the first
            button only adds 1. A timeout would batch these too. The closure is the
            reason the count stalls, not the batching.
          </p>
        </>
      ),
    },
  ],
};
