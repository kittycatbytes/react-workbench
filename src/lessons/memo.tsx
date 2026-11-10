import { memo, useCallback, useMemo, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { RenderMark } from "../workbench/bits.tsx";

const cities = ["Austin", "Boston", "Cairo", "Dakar", "Oslo", "Ottawa", "Paris", "Quito"];

const Row = memo(function Row({
  label,
  onPick,
}: {
  label: string;
  onPick: () => void;
}) {
  return (
    <button type="button" className="ghost" onClick={onPick}>
      {label} <RenderMark name="row" />
    </button>
  );
});

function BareRow({ label, onPick }: { label: string; onPick: () => void }) {
  return (
    <button type="button" className="ghost" onClick={onPick}>
      {label} <RenderMark name="row" />
    </button>
  );
}

function MemoBench({ mode }: { mode: "stable" | "inline" | "bare" }) {
  const [theme, setTheme] = useState<"day" | "night">("day");
  const [picked, setPicked] = useState("nothing");
  const onPick = useCallback(() => setPicked("the row"), []);
  const Child = mode === "bare" ? BareRow : Row;
  const handler = mode === "inline" ? () => setPicked("the row") : onPick;
  return (
    <div className="widget stack" data-theme={theme}>
      <div className="row">
        <RenderMark name="parent" />
        <span className="hint">Theme {theme}</span>
      </div>
      <p className="readout">
        Picked <strong data-testid="picked">{picked}</strong>
      </p>
      <div className="row">
        <button
          type="button"
          onClick={() => setTheme((value) => (value === "day" ? "night" : "day"))}
        >
          Toggle theme
        </button>
        <Child label="Child row" onPick={handler} />
      </div>
    </div>
  );
}

function MemoFilter() {
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);
  const runs = useRefRuns();
  const shown = useMemo(() => {
    runs.current += 1;
    return cities.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
  }, [query, runs]);
  return (
    <FilterBody
      query={query}
      tick={tick}
      runs={runs.current}
      shown={shown}
      onQuery={setQuery}
      onTick={() => setTick((value) => value + 1)}
    />
  );
}

function PlainFilter() {
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);
  const runs = useRefRuns();
  runs.current += 1;
  const shown = cities.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
  return (
    <FilterBody
      query={query}
      tick={tick}
      runs={runs.current}
      shown={shown}
      onQuery={setQuery}
      onTick={() => setTick((value) => value + 1)}
    />
  );
}

function useRefRuns() {
  const runs = useState(() => ({ current: 0 }))[0];
  return runs;
}

function FilterBody({
  query,
  tick,
  runs,
  shown,
  onQuery,
  onTick,
}: {
  query: string;
  tick: number;
  runs: number;
  shown: string[];
  onQuery: (value: string) => void;
  onTick: () => void;
}) {
  return (
    <div className="widget stack">
      <RenderMark name="filter" />
      <div className="row">
        <input
          type="text"
          value={query}
          aria-label="City filter"
          placeholder="Filter cities"
          onChange={(event) => onQuery(event.target.value)}
        />
        <button type="button" className="ghost" onClick={onTick}>
          Tick parent ({tick})
        </button>
      </div>
      <p className="readout">
        Filter ran <strong data-testid="runs">{runs}</strong> time{runs === 1 ? "" : "s"}
      </p>
      <ul className="matches">
        {shown.map((city) => (
          <li key={city}>{city}</li>
        ))}
      </ul>
    </div>
  );
}

const stableCode = sample`
  const Row = memo(function Row({ label, onPick }) {
    return <button onClick={onPick}>{label}</button>;
  });

  function MemoBench() {
    const [theme, setTheme] = useState("day");
    const onPick = useCallback(() => setPicked("the row"), []); /*focus*/
    return (
      <>
        <button onClick={() => setTheme((value) => (value === "day" ? "night" : "day"))}>
          Toggle theme
        </button>
        <Row label="Child row" onPick={onPick} /> /*focus*/
      </>
    );
  }
`;

const inlineCode = sample`
  function MemoBench() {
    const [theme, setTheme] = useState("day");
    return (
      <>
        <button onClick={() => setTheme((value) => (value === "day" ? "night" : "day"))}>
          Toggle theme
        </button>
        <Row
          label="Child row"
          onPick={() => setPicked("the row")} /*focus*/
        />
      </>
    );
  }
`;

const bareCode = sample`
  function BareRow({ label, onPick }) { /*focus*/
    return <button onClick={onPick}>{label}</button>;
  }

  function MemoBench() {
    const onPick = useCallback(() => setPicked("the row"), []);
    return <BareRow label="Child row" onPick={onPick} />;
  }
`;

const memoFilterCode = sample`
  function MemoFilter() {
    const [query, setQuery] = useState("");
    const [tick, setTick] = useState(0);
    const shown = useMemo(() => { /*focus*/
      return cities.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
    }, [query]); /*focus*/
    return (
      <>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
        <button onClick={() => setTick((value) => value + 1)}>Tick parent</button>
        <p>{tick}</p>
      </>
    );
  }
`;

const plainFilterCode = sample`
  function PlainFilter() {
    const [query, setQuery] = useState("");
    const shown = cities.filter((city) => /*focus*/
      city.toLowerCase().includes(query.toLowerCase())
    );
    return <input value={query} onChange={(event) => setQuery(event.target.value)} />;
  }
`;

export function MemoDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "inline") return <MemoBench mode={repaired ? "stable" : "inline"} />;
  if (scenarioId === "bare") return <MemoBench mode={repaired ? "stable" : "bare"} />;
  if (scenarioId === "usememo") return <MemoFilter />;
  if (scenarioId === "plain") return <PlainFilter />;
  return <MemoBench mode="stable" />;
}

export const memoLesson: Lesson = {
  id: "memo",
  kicker: "memo",
  title: "Skipping a render",
  blurb: "memo, useMemo, and useCallback decide whether a later render can be skipped.",
  Demo: MemoDemo,
  scenarios: [
    {
      id: "stable",
      label: "Stable callback",
      tease: "memo plus useCallback lets the row skip the theme render.",
      tryThis: "Toggle the theme and compare the two render marks.",
      code: stableCode.text,
      focus: stableCode.focus,
      explanation: (
        <>
          <p>
            <code>memo</code> skips a render when every prop is the same by{" "}
            <code>Object.is</code>. The row receives <code>label</code> and{" "}
            <code>onPick</code>. <code>useCallback</code> keeps <code>onPick</code> as
            the same function across parent renders, because its dependency list does
            not change.
          </p>
          <p>
            Toggle the theme. The parent mark climbs. The row's mark stays. Both props
            passed <code>Object.is</code>, so React does not call the row function.
          </p>
        </>
      ),
    },
    {
      id: "inline",
      label: "Inline callback",
      tease: "A new function on every render defeats memo.",
      tryThis: "Toggle the theme. The row renders too.",
      code: inlineCode.text,
      focus: inlineCode.focus,
      explanation: (
        <>
          <p>
            The row is still wrapped in <code>memo</code>. The parent passes{" "}
            <code>{"onPick={() => setPicked(\"the row\")}"}</code>. That arrow function
            is a new value every render. <code>Object.is</code> fails, and{" "}
            <code>memo</code> gives up.
          </p>
          <p>
            Toggle the theme and both marks climb. <code>memo</code> on a child does
            nothing for a callback prop unless the parent keeps the function stable.
          </p>
        </>
      ),
      repair: {
        code: stableCode.text,
        focus: stableCode.focus,
        tryThis: "Toggle the theme. The row mark stays put.",
        explanation: (
          <>
            <p>
              <code>useCallback</code> keeps <code>onPick</code> as the same function
              across renders. The row is wrapped in <code>memo</code>, and its props
              pass <code>Object.is</code>. Toggle the theme. The parent renders. The
              row does not.
            </p>
            <p>
              The broken version passed a new arrow function on every render, so{" "}
              <code>memo</code> had nothing stable to compare. The callback is the fix.
            </p>
          </>
        ),
      },
    },
    {
      id: "bare",
      label: "No memo",
      tease: "The child function runs whenever the parent renders.",
      tryThis: "Toggle the theme. Both marks climb.",
      code: bareCode.text,
      focus: bareCode.focus,
      explanation: (
        <>
          <p>
            There is no <code>memo</code>. The parent rendered, so React calls the
            child function. The callback can be stable and it still does not matter.
            Theme toggles climb both marks.
          </p>
          <p>
            Skipping a child is an opt-in. Without it, a parent render walks into the
            child.
          </p>
        </>
      ),
      repair: {
        code: stableCode.text,
        focus: stableCode.focus,
        tryThis: "Toggle the theme. The row mark stays put.",
        explanation: (
          <>
            <p>
              The row is wrapped in <code>memo</code>, and <code>onPick</code> comes
              from <code>useCallback</code>. Toggle the theme. The parent renders.
              The row's props are the same, so the row function does not run.
            </p>
            <p>
              The broken version was an ordinary function component. A parent render
              always called it. <code>memo</code> is the opt-in that lets it skip.
            </p>
          </>
        ),
      },
    },
    {
      id: "usememo",
      label: "useMemo",
      tease: "The filter runs again only when the query changes.",
      tryThis: "Tick the parent, then change the query.",
      code: memoFilterCode.text,
      focus: memoFilterCode.focus,
      explanation: (
        <>
          <p>
            The filter sits inside <code>useMemo</code>. React keeps the previous list
            while <code>query</code> is unchanged. Tick parent re-renders this
            component, and the "filter ran" count stays. Change the query and the
            count moves, because that dependency changed.
          </p>
          <p>
            <code>useMemo</code> is a hint. React may throw the cache away. Don't put
            a required side effect in there. The count on this stage is a measurement,
            not something the filter needs in order to be correct.
          </p>
        </>
      ),
    },
    {
      id: "plain",
      label: "Filter in the body",
      tease: "Every render filters again, including a tick that ignores the query.",
      tryThis: "Tick the parent and watch the calc count.",
      code: plainFilterCode.text,
      focus: plainFilterCode.focus,
      explanation: (
        <>
          <p>
            The filter runs in the component body. Every render recalculates, including
            Tick parent, which does not change the query. The count climbs on both.
          </p>
          <p>
            For eight cities this work is cheap. The count is there so you can see the
            difference from <code>useMemo</code> without pretending the list was slow.
          </p>
        </>
      ),
    },
  ],
};
