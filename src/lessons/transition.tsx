import { memo, useDeferredValue, useState, useTransition } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { names } from "./names.ts";

let sink = 0;

function stall(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) sink = (sink + 1) % 1000;
  return sink;
}

const SlowList = memo(function SlowList({ query }: { query: string }) {
  stall(40);
  const matches = names.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <p className="hint" data-testid="match-count">
        {matches.length} matches
      </p>
      <ul className="matches">
        {matches.slice(0, 8).map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </>
  );
});

function TransitionSearch() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="widget stack">
      <input
        type="text"
        value={text}
        aria-label="Filter names"
        placeholder="Filter names"
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          startTransition(() => setQuery(next));
        }}
      />
      <p className={pending ? "pending" : "pending quiet"} data-testid="pending">
        {pending ? "List is catching up." : "List matches the input."}
      </p>
      <SlowList query={query} />
    </div>
  );
}

function BlockingSearch() {
  const [text, setText] = useState("");
  return (
    <div className="widget stack">
      <input
        type="text"
        value={text}
        aria-label="Filter names"
        placeholder="Filter names"
        onChange={(event) => setText(event.target.value)}
      />
      <p className="pending">The input waits on the list.</p>
      <SlowList query={text} />
    </div>
  );
}

function DeferredSearch() {
  const [text, setText] = useState("");
  const deferred = useDeferredValue(text);
  const stale = deferred !== text;
  return (
    <div className="widget stack">
      <input
        type="text"
        value={text}
        aria-label="Filter names"
        placeholder="Filter names"
        onChange={(event) => setText(event.target.value)}
      />
      <p className={stale ? "pending" : "pending quiet"} data-testid="pending">
        {stale ? "List is behind the input." : "List matches the input."}
      </p>
      <SlowList query={deferred} />
    </div>
  );
}

const transitionCode = sample`
  function TransitionSearch() {
    const [text, setText] = useState("");
    const [query, setQuery] = useState("");
    const [pending, startTransition] = useTransition();
    return (
      <>
        <input
          value={text}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            startTransition(() => setQuery(next));
          }}
        />
        <p>{pending ? "List is catching up." : "List matches the input."}</p>
        <SlowList query={query} />
      </>
    );
  }

  const SlowList = memo(function SlowList({ query }) {
    stall(40);
    const matches = names.filter((name) => name.toLowerCase().includes(query.toLowerCase()));
    return <p>{matches.length} matches</p>;
  });
`;

const blockingCode = sample`
  function BlockingSearch() {
    const [text, setText] = useState("");
    return (
      <>
        <input value={text} onChange={(event) => setText(event.target.value)} />
        <p>The input waits on the list.</p>
        <SlowList query={text} />
        <p>{matches.length} matches</p>
      </>
    );
  }
`;

const deferredCode = sample`
  function DeferredSearch() {
    const [text, setText] = useState("");
    const deferred = useDeferredValue(text);
    const stale = deferred !== text;
    return (
      <>
        <input value={text} onChange={(event) => setText(event.target.value)} />
        <SlowList query={deferred} />
        <p>{stale ? "List is behind the input." : "List matches the input."}</p>
      </>
    );
  }
`;

export function TransitionDemo({ scenarioId }: DemoProps) {
  if (scenarioId === "blocking") return <BlockingSearch />;
  if (scenarioId === "deferred") return <DeferredSearch />;
  return <TransitionSearch />;
}

export const transitionLesson: Lesson = {
  id: "transition",
  kicker: "useTransition",
  title: "Urgent and deferred updates",
  blurb: "useTransition keeps a fast update on the screen while a slow one catches up.",
  Demo: TransitionDemo,
  scenarios: [
    {
      id: "transition",
      label: "useTransition",
      tease: "The input renders now. The slow list renders when it can.",
      tryThis: "Type quickly into the filter.",
      code: transitionCode.text,
      focus: [11, 12, 21],
      explanation: (
        <>
          <p>
            The input's value is urgent. <code>setText</code> runs outside the
            transition, so the keystroke can paint immediately.{" "}
            <code>startTransition</code> marks the list update as work that can wait.
            React keeps the previous list on screen, sets <code>pending</code>, and
            renders the slow list when it can.
          </p>
          <p>
            <code>SlowList</code> stalls for 40ms on purpose, and it is wrapped in{" "}
            <code>memo</code>. The urgent render does not change <code>query</code>,
            so the stall does not run in that render. The input should stay with your
            typing. The pending line is how you see the list lag.
          </p>
        </>
      ),
    },
    {
      id: "blocking",
      label: "One update for both",
      tease: "The input and the slow list share a render, so typing waits.",
      tryThis: "Type quickly and watch the input wait on the list.",
      code: blockingCode.text,
      focus: [4, 5],
      explanation: (
        <>
          <p>
            One <code>setState</code> writes the input. The slow list reads that same
            state, in the same render. The 40ms stall blocks that render, so the
            input waits on the list.
          </p>
          <p>
            This is the behavior <code>useTransition</code> is for. Keep the urgent
            paint small, and let the heavy child lag behind it.
          </p>
        </>
      ),
    },
    {
      id: "deferred",
      label: "useDeferredValue",
      tease: "The list receives a lagging copy of the text.",
      tryThis: "Type quickly. The list trails the input.",
      code: deferredCode.text,
      focus: [3, 7],
      explanation: (
        <>
          <p>
            <code>useDeferredValue</code> takes the urgent text and returns a lagging
            copy. The input renders with <code>text</code>. The list renders with{" "}
            <code>deferred</code>. When they differ, the pending line says the list
            is behind.
          </p>
          <p>
            You did not write a second <code>setState</code>. React schedules the
            deferred update the same way it schedules a transition. The list component
            is the same <code>SlowList</code> as the other two scenarios.
          </p>
        </>
      ),
    },
  ],
};
