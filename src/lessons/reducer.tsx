import { StrictMode, useEffect, useReducer, useRef, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { RenderMark } from "../workbench/bits.tsx";

type Track = { id: number; label: string; done: boolean };

type State = {
  nextId: number;
  items: Track[];
};

type Action =
  | { type: "add"; label: string }
  | { type: "toggle"; id: number }
  | { type: "clear-done" };

function freshState(): State {
  return {
    nextId: 3,
    items: [
      { id: 1, label: "River", done: false },
      { id: 2, label: "Kettle", done: true },
    ],
  };
}

function pureReducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return {
        nextId: state.nextId + 1,
        items: [...state.items, { id: state.nextId, label: action.label, done: false }],
      };
    case "toggle":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, done: !item.done } : item,
        ),
      };
    case "clear-done":
      return { ...state, items: state.items.filter((item) => !item.done) };
    default:
      return state;
  }
}

function mutatingReducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      state.items.push({ id: state.nextId, label: action.label, done: false });
      state.nextId += 1;
      return state;
    case "toggle": {
      const item = state.items.find((entry) => entry.id === action.id);
      if (item) item.done = !item.done;
      return state;
    }
    case "clear-done":
      state.items = state.items.filter((item) => !item.done);
      return state;
    default:
      return state;
  }
}

const sideEffects: string[] = [];

function impureReducer(state: State, action: Action): State {
  sideEffects.push(`${action.type} #${sideEffects.length + 1}`);
  return pureReducer(state, action);
}

function TrackList({
  items,
  onToggle,
}: {
  items: Track[];
  onToggle: (id: number) => void;
}) {
  return (
    <ul className="tracks" data-testid="tracks">
      {items.map((item) => (
        <li key={item.id}>
          <label>
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => onToggle(item.id)}
            />{" "}
            <span className={item.done ? "done" : ""}>{item.label}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function PurePlaylist() {
  const [state, dispatch] = useReducer(pureReducer, null, freshState);
  const [label, setLabel] = useState("");
  return (
    <div className="widget stack">
      <RenderMark name="playlist" />
      <div className="row">
        <input
          type="text"
          value={label}
          aria-label="Track name"
          placeholder="Track name"
          onChange={(event) => setLabel(event.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            const next = label.trim();
            if (!next) return;
            dispatch({ type: "add", label: next });
            setLabel("");
          }}
        >
          Add
        </button>
        <button type="button" className="ghost" onClick={() => dispatch({ type: "clear-done" })}>
          Clear finished
        </button>
      </div>
      <TrackList items={state.items} onToggle={(id) => dispatch({ type: "toggle", id })} />
    </div>
  );
}

function MutatingPlaylist({ repaired }: { repaired: boolean }) {
  const [state, dispatch] = useReducer(repaired ? pureReducer : mutatingReducer, null, freshState);
  const [tick, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="widget stack">
      <RenderMark name="playlist" />
      <div className="row">
        <input ref={inputRef} type="text" aria-label="Track name" placeholder="Track name" />
        <button
          type="button"
          onClick={() => {
            const next = inputRef.current?.value.trim() ?? "";
            if (!next || !inputRef.current) return;
            dispatch({ type: "add", label: next });
            inputRef.current.value = "";
          }}
        >
          Add
        </button>
        {repaired ? null : (
          <button type="button" className="ghost" onClick={() => setTick((value) => value + 1)}>
            Render anyway ({tick})
          </button>
        )}
      </div>
      <TrackList items={state.items} onToggle={(id) => dispatch({ type: "toggle", id })} />
      {repaired ? (
        <p className="hint">The reducer returns a new list, so Add paints the track.</p>
      ) : (
        <p className="hint">Add and toggle look frozen until something else renders.</p>
      )}
    </div>
  );
}

function ImpurePlaylist({ repaired }: { repaired: boolean }) {
  return (
    <StrictMode>
      <ImpureBody repaired={repaired} />
    </StrictMode>
  );
}

function ImpureBody({ repaired }: { repaired: boolean }) {
  const [state, dispatch] = useReducer(repaired ? pureReducer : impureReducer, null, freshState);
  const [label, setLabel] = useState("");
  useEffect(() => {
    sideEffects.length = 0;
    return () => {
      sideEffects.length = 0;
    };
  }, []);
  return (
    <div className="widget stack">
      <RenderMark name="playlist" />
      <div className="row">
        <input
          type="text"
          value={label}
          aria-label="Track name"
          placeholder="Track name"
          onChange={(event) => setLabel(event.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            const next = label.trim();
            if (!next) return;
            if (repaired) sideEffects.push(`add #${sideEffects.length + 1}`);
            dispatch({ type: "add", label: next });
            setLabel("");
          }}
        >
          Add
        </button>
      </div>
      <p className="hint" data-testid="counts">
        Tracks {state.items.length}. External log {sideEffects.length}.
      </p>
      <TrackList items={state.items} onToggle={(id) => dispatch({ type: "toggle", id })} />
      <div className="log" data-testid="side-log">
        {sideEffects.length === 0 ? (
          <p className="log-empty">External log is empty.</p>
        ) : (
          sideEffects.map((line, index) => (
            <div key={`${index}:${line}`} className="log-line">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const pureCode = sample`
  function pureReducer(state, action) {
    switch (action.type) {
      case "add":
        return {
          nextId: state.nextId + 1,
          items: [...state.items, { id: state.nextId, label: action.label, done: false }], /*focus*/
        };
      case "toggle":
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.id ? { ...item, done: !item.done } : item,
          ),
        };
      default:
        return state;
    }
  }
`;

const mutateCode = sample`
  function mutatingReducer(state, action) {
    switch (action.type) {
      case "add":
        state.items.push({ id: state.nextId, label: action.label, done: false }); /*focus*/
        state.nextId += 1;
        return state; /*focus*/
      default:
        return state;
    }
  }
`;

const impureCode = sample`
  const sideEffects = [];

  function impureReducer(state, action) {
    sideEffects.push(action.type); /*focus*/
    return pureReducer(state, action);
  }

  function ImpurePlaylist() {
    const [state, dispatch] = useReducer(impureReducer, initialState);
    return (
      <StrictMode>
        <button onClick={() => dispatch({ type: "add", label })}>Add</button>
      </StrictMode>
    );
  }
`;

const impureFixed = sample`
  function ImpurePlaylist() {
    const [state, dispatch] = useReducer(pureReducer, initialState);
    return (
      <StrictMode>
        <button
          onClick={() => {
            sideEffects.push("add"); /*focus*/
            dispatch({ type: "add", label });
          }}
        >
          Add
        </button>
      </StrictMode>
    );
  }
`;

export function ReducerDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "mutate") return <MutatingPlaylist repaired={repaired} />;
  if (scenarioId === "impure") return <ImpurePlaylist repaired={repaired} />;
  return <PurePlaylist />;
}

export const reducerLesson: Lesson = {
  id: "reducer",
  kicker: "useReducer",
  title: "Transitions in one place",
  blurb: "A reducer moves a component from one state to the next when an action arrives.",
  Demo: ReducerDemo,
  scenarios: [
    {
      id: "pure",
      label: "Pure reducer",
      tease: "Each action returns a new state object. The list follows it.",
      tryThis: "Add a track, toggle one, then clear finished.",
      code: pureCode.text,
      focus: pureCode.focus,
      explanation: (
        <>
          <p>
            The reducer is a function from <code>(state, action)</code> to the next
            state. Add a track, toggle one, clear the finished ones. Each click
            dispatches an action, the reducer returns a new object, and React renders
            that object.
          </p>
          <p>
            Nothing else writes to the list. The event handlers only dispatch. That is
            the point of the reducer: the transitions live in one function you can
            read without the JSX.
          </p>
        </>
      ),
    },
    {
      id: "mutate",
      label: "Return the same object",
      tease: "Pushing into the array and returning it skips the render.",
      tryThis: "Add a track. The list stays put. Then press Render anyway.",
      code: mutateCode.text,
      focus: mutateCode.focus,
      explanation: (
        <>
          <p>
            The reducer pushes into <code>state.items</code> and returns{" "}
            <code>state</code>. Same reference. React compares the return value to the
            previous state with <code>Object.is</code> and skips the render. The list
            on screen stays as it was.
          </p>
          <p>
            The input is cleared by writing to the DOM node, not by setting state, so
            that clear does not accidentally render the smuggled track. Press Render
            anyway. The component reads <code>state.items</code>, which was mutated,
            and the hidden track appears.
          </p>
          <p>The reducer lied about what changed. A later render told on it.</p>
        </>
      ),
      repair: {
        code: pureCode.text,
        focus: pureCode.focus,
        tryThis: "Add a track. It shows up on that click.",
        explanation: (
          <>
            <p>
              Add returns a new object and a new array. React sees a different state
              and renders. The track is on the list immediately. Toggle and Clear
              finished do the same: copy, then change the copy.
            </p>
            <p>
              The broken reducer edited the array it was given and returned that same
              object. React skipped the render. Returning a new object is the fix.
            </p>
          </>
        ),
      },
    },
    {
      id: "impure",
      label: "Side effect in the reducer",
      tease: "Strict Mode calls the reducer an extra time and throws that result away.",
      tryThis: "Add one track. Compare the track count with the external log.",
      code: impureCode.text,
      focus: impureCode.focus,
      explanation: (
        <>
          <p>
            This scenario wraps the playlist in <code>StrictMode</code>. In
            development, React calls the reducer twice for a dispatch and keeps one
            result. The list grows by one track, because the reducer returns a new
            list from the previous state and React discards the extra call.
          </p>
          <p>
            The external array is not state. Both calls push to it, so one Add writes
            two log lines. The counts on the stage are the evidence. If they match,
            the extra call did not happen. They should not match.
          </p>
          <p>
            Keep the reducer pure. Put the side effect in the event handler, or in an
            effect that watches the state you committed.
          </p>
        </>
      ),
      repair: {
        code: impureFixed.text,
        focus: impureFixed.focus,
        tryThis: "Add one track. The track count and the external log match.",
        explanation: (
          <>
            <p>
              The reducer only returns the next list. The click handler writes the log
              line, and a click runs once. <code>StrictMode</code> can still call the
              reducer an extra time. That extra call no longer touches the log.
            </p>
            <p>
              Add one track. The list grows by one, and the external log grows by one
              line.
            </p>
          </>
        ),
      },
    },
  ],
};
