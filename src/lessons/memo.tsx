import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { CountStepper, RenderMark } from "../workbench/bits.tsx";
import { JsApi } from "../workbench/JsApi.tsx";

const cities = ["Austin", "Boston", "Cairo", "Dakar", "Oslo", "Ottawa", "Paris", "Quito"];

const files = [
  { id: "1", kind: "Doc", n: 1, group: "Doc" },
  { id: "2", kind: "Doc", n: 2, group: "Doc" },
  { id: "3", kind: "Image", n: 3, group: "Image" },
  { id: "4", kind: "Folder", n: 4, group: "Folder" },
  { id: "5", kind: "Image", n: 5, group: "Image" },
  { id: "6", kind: "Folder", n: 6, group: "Folder" },
  { id: "7", kind: "Image", n: 7, group: "Image" },
  { id: "8", kind: "Folder", n: 8, group: "Folder" },
];

function Check({ selected }: { selected: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 550);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <p className="status" data-ready={ready ? "true" : "false"}>
      {ready ? (selected ? "Selected" : "Deselected") : "Checking status..."}
    </p>
  );
}

function FileRow({
  id,
  kind,
  n,
  selected,
  onSelect,
}: {
  id: string;
  kind: string;
  n: number;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const checks = useRef(0);
  checks.current += 1;
  return (
    <article className="file" data-file={id} data-selected={selected ? "true" : "false"}>
      <button
        type="button"
        className="mark"
        aria-pressed={selected}
        aria-label={selected ? "Selected" : "Deselected"}
        onClick={() => onSelect(id)}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.2 8.3 6.3 11.4 12.8 4.6" />
        </svg>
      </button>
      <span className="kind">{kind}</span>
      <span className="num">#{n}</span>
      <Check key={checks.current} selected={selected} />
      <RenderMark name={id} label="" />
    </article>
  );
}

const MemoRow = memo(FileRow);

function Library({ mode }: { mode: "stable" | "inline" | "bare" }) {
  const [group, setGroup] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const onSelect = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  }, []);
  const shown = files.filter((file) => group === "All" || file.group === group);
  const Row = mode === "bare" ? FileRow : MemoRow;

  return (
    <div className="widget stack">
      <div className="row">
        <RenderMark name="parent" />
        <p className="readout">
          Showing <strong data-testid="group">{group}</strong>
        </p>
      </div>
      <div className="row" role="group" aria-label="Group">
        {(["All", "Doc", "Image", "Folder"] as const).map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={group === name}
            onClick={() => setGroup(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <ul className="files">
        {shown.map((file) => (
          <li key={file.id}>
            <Row
              id={file.id}
              kind={file.kind}
              n={file.n}
              selected={file.id === selectedId}
              onSelect={
                mode === "inline"
                  ? () => setSelectedId((current) => (current === file.id ? null : file.id))
                  : onSelect
              }
            />
          </li>
        ))}
      </ul>
      <div className="file-actions">
        <button type="button">Compress Item</button>
      </div>
    </div>
  );
}

function MemoFilter() {
  const [query, setQuery] = useState("");
  const [visits, setVisits] = useState(1);
  const runs = useRefRuns();
  const shown = useMemo(() => {
    runs.current += 1;
    return cities.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
  }, [query, runs]);
  return (
    <FilterBody
      query={query}
      visits={visits}
      runs={runs.current}
      shown={shown}
      onQuery={setQuery}
      onVisits={setVisits}
    />
  );
}

function PlainFilter() {
  const [query, setQuery] = useState("");
  const [visits, setVisits] = useState(1);
  const runs = useRefRuns();
  runs.current += 1;
  const shown = cities.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
  return (
    <FilterBody
      query={query}
      visits={visits}
      runs={runs.current}
      shown={shown}
      onQuery={setQuery}
      onVisits={setVisits}
    />
  );
}

function useRefRuns() {
  const runs = useState(() => ({ current: 0 }))[0];
  return runs;
}

function FilterBody({
  query,
  visits,
  runs,
  shown,
  onQuery,
  onVisits,
}: {
  query: string;
  visits: number;
  runs: number;
  shown: string[];
  onQuery: (value: string) => void;
  onVisits: (next: number) => void;
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
        <CountStepper label="Times visited" value={visits} onChange={onVisits} />
      </div>
      <p className="readout">
        Filter ran <strong data-testid="runs">{runs}</strong> time{runs === 1 ? "" : "s"}
      </p>
      <p className="hint">This list should not be filtered again when the times visited change.</p>
      <ul className="matches">
        {shown.map((city) => (
          <li key={city}>{city}</li>
        ))}
      </ul>
    </div>
  );
}

const stableCode = sample`
  const files = [
    { id: "1", kind: "Doc", n: 1, group: "Doc" },
    { id: "2", kind: "Doc", n: 2, group: "Doc" },
    { id: "3", kind: "Image", n: 3, group: "Image" },
    { id: "4", kind: "Folder", n: 4, group: "Folder" },
    { id: "5", kind: "Image", n: 5, group: "Image" },
    { id: "6", kind: "Folder", n: 6, group: "Folder" },
    { id: "7", kind: "Image", n: 7, group: "Image" },
    { id: "8", kind: "Folder", n: 8, group: "Folder" },
  ];

  function Check({ selected }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
      const id = setTimeout(() => setReady(true), 550);
      return () => clearTimeout(id);
    }, []);
    return <p>{ready ? (selected ? "Selected" : "Deselected") : "Checking status..."}</p>;
  }

  const Row = memo(function Row({ id, kind, n, selected, onSelect }) {
    const checks = useRef(0);
    checks.current += 1; /*focus*/
    return (
      <article>
        <button aria-label={selected ? "Selected" : "Deselected"} onClick={() => onSelect(id)} />
        <span>{kind}</span>
        <span>#{n}</span>
        <Check key={checks.current} selected={selected} />
      </article>
    );
  });

  function Library() {
    const [group, setGroup] = useState("All");
    const [selectedId, setSelectedId] = useState(null);
    const onSelect = useCallback((id) => { /*focus*/
      setSelectedId((current) => (current === id ? null : id));
    }, []);
    const shown = files.filter((file) => group === "All" || file.group === group);
    return (
      <>
        <p>Showing {group}</p>
        <button onClick={() => setGroup("All")}>All</button>
        <button onClick={() => setGroup("Doc")}>Doc</button>
        <button onClick={() => setGroup("Image")}>Image</button>
        <button onClick={() => setGroup("Folder")}>Folder</button>
        {shown.map((file) => (
          <Row
            key={file.id}
            id={file.id}
            kind={file.kind}
            n={file.n}
            selected={selectedId === file.id}
            onSelect={onSelect}
          />
        ))}
        <button>Compress Item</button> // non-functional, shelled element for demo purposes only
      </>
    );
  }
`;

const inlineCode = sample`
  const files = [
    { id: "1", kind: "Doc", n: 1, group: "Doc" },
    { id: "2", kind: "Doc", n: 2, group: "Doc" },
    { id: "3", kind: "Image", n: 3, group: "Image" },
    { id: "4", kind: "Folder", n: 4, group: "Folder" },
    { id: "5", kind: "Image", n: 5, group: "Image" },
    { id: "6", kind: "Folder", n: 6, group: "Folder" },
    { id: "7", kind: "Image", n: 7, group: "Image" },
    { id: "8", kind: "Folder", n: 8, group: "Folder" },
  ];

  function Check({ selected }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
      const id = setTimeout(() => setReady(true), 550);
      return () => clearTimeout(id);
    }, []);
    return <p>{ready ? (selected ? "Selected" : "Deselected") : "Checking status..."}</p>;
  }

  const Row = memo(function Row({ id, kind, n, selected, onSelect }) {
    const checks = useRef(0);
    checks.current += 1;
    return (
      <article>
        <button aria-label={selected ? "Selected" : "Deselected"} onClick={() => onSelect(id)} />
        <span>{kind}</span>
        <span>#{n}</span>
        <Check key={checks.current} selected={selected} />
      </article>
    );
  });

  function Library() {
    const [group, setGroup] = useState("All");
    const [selectedId, setSelectedId] = useState(null);
    const shown = files.filter((file) => group === "All" || file.group === group);
    return (
      <>
        <p>Showing {group}</p>
        <button onClick={() => setGroup("All")}>All</button>
        <button onClick={() => setGroup("Doc")}>Doc</button>
        <button onClick={() => setGroup("Image")}>Image</button>
        <button onClick={() => setGroup("Folder")}>Folder</button>
        {shown.map((file) => (
          <Row
            key={file.id}
            id={file.id}
            kind={file.kind}
            n={file.n}
            selected={selectedId === file.id}
            onSelect={() => setSelectedId((current) => (current === file.id ? null : file.id))} /*focus*/
          />
        ))}
        <button>Compress Item</button> // non-functional, shelled element for demo purposes only
      </>
    );
  }
`;

const bareCode = sample`
  const files = [
    { id: "1", kind: "Doc", n: 1, group: "Doc" },
    { id: "2", kind: "Doc", n: 2, group: "Doc" },
    { id: "3", kind: "Image", n: 3, group: "Image" },
    { id: "4", kind: "Folder", n: 4, group: "Folder" },
    { id: "5", kind: "Image", n: 5, group: "Image" },
    { id: "6", kind: "Folder", n: 6, group: "Folder" },
    { id: "7", kind: "Image", n: 7, group: "Image" },
    { id: "8", kind: "Folder", n: 8, group: "Folder" },
  ];

  function Check({ selected }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
      const id = setTimeout(() => setReady(true), 550);
      return () => clearTimeout(id);
    }, []);
    return <p>{ready ? (selected ? "Selected" : "Deselected") : "Checking status..."}</p>;
  }

  function Row({ id, kind, n, selected, onSelect }) { /*focus*/
    const checks = useRef(0);
    checks.current += 1;
    return (
      <article>
        <button aria-label={selected ? "Selected" : "Deselected"} onClick={() => onSelect(id)} />
        <span>{kind}</span>
        <span>#{n}</span>
        <Check key={checks.current} selected={selected} />
      </article>
    );
  }

  function Library() {
    const [group, setGroup] = useState("All");
    const [selectedId, setSelectedId] = useState(null);
    const onSelect = useCallback((id) => {
      setSelectedId((current) => (current === id ? null : id));
    }, []);
    const shown = files.filter((file) => group === "All" || file.group === group);
    return (
      <>
        <p>Showing {group}</p>
        <button onClick={() => setGroup("All")}>All</button>
        <button onClick={() => setGroup("Doc")}>Doc</button>
        <button onClick={() => setGroup("Image")}>Image</button>
        <button onClick={() => setGroup("Folder")}>Folder</button>
        {shown.map((file) => (
          <Row
            key={file.id}
            id={file.id}
            kind={file.kind}
            n={file.n}
            selected={selectedId === file.id}
            onSelect={onSelect}
          />
        ))}
        <button>Compress Item</button> // non-functional, shelled element for demo purposes only
      </>
    );
  }
`;
const memoFilterCode = sample`
  function MemoFilter() {
    const [query, setQuery] = useState("");
    const [visits, setVisits] = useState(1);
    const runs = 1;
    const shown = useMemo(() => { /*focus*/
      return cities.filter((city) => city.toLowerCase().includes(query.toLowerCase())); //cities defined off-screen
    }, [query]); /*focus*/
    return (
      <>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
        <p>Times visited {visits}</p>
        <button onClick={() => setVisits((value) => Math.max(1, value - 1))}>-</button>
        <button onClick={() => setVisits((value) => value + 1)}>+</button>
        <p>Filter ran {runs} time</p>
        <p>This list should not be filtered again when the times visited change.</p>
        <ul>
          {shown.map((city) => (
            <li key={city}>{city}</li>
          ))}
        </ul>
      </>
    );
  }
`;

const plainFilterCode = sample`
  function PlainFilter() {
    const [query, setQuery] = useState("");
    const [visits, setVisits] = useState(1);
    const runs = 1;
    const shown = cities.filter((city) => /*focus*/
      city.toLowerCase().includes(query.toLowerCase())
    ); //cities defined off-screen
    return (
      <>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
        <p>Times visited {visits}</p>
        <button onClick={() => setVisits((value) => Math.max(1, value - 1))}>-</button>
        <button onClick={() => setVisits((value) => value + 1)}>+</button>
        <p>Filter ran {runs} time</p>
        <p>This list should not be filtered again when the times visited change.</p>
        <ul>
          {shown.map((city) => (
            <li key={city}>{city}</li>
          ))}
        </ul>
      </>
    );
  }
`;

export function MemoDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "inline") return <Library mode={repaired ? "stable" : "inline"} />;
  if (scenarioId === "bare") return <Library mode={repaired ? "stable" : "bare"} />;
  if (scenarioId === "usememo") return repaired ? <MemoFilter /> : <PlainFilter />;
  return <Library mode="stable" />;
}

export const memoLesson: Lesson = {
  id: "memo",
  kicker: "memo",
  title: "Skipping a render",
  blurb: "A file can sit still while you change the group. memo and useCallback are how. The file rechecks when its own selection changes. useMemo does the same for a calculation.",
  Demo: MemoDemo,
  scenarios: [
    {
      id: "stable",
      label: "Group changes",
      tease: "memo plus useCallback lets a file sit still when you change the group.",
      tryThis: "Press Doc. Doc #1 and Doc #2 stay on Deselected. Then press the check on Doc #1, and press it again.",
      code: stableCode.text,
      focus: stableCode.focus,
      explanation: (
        <>
          <p>
            The group buttons belong to the parent. Press Doc and the parent renders
            again. The images and folders leave the list. Doc #1 and Doc #2 stay. A
            row's props are its id, its kind, its number, whether it is selected, and{" "}
            <code>onSelect</code>. The group is not one of them.
          </p>
          <p>
            <code>selected</code> did not change for the files that stayed.{" "}
            <code>useCallback</code> keeps <code>onSelect</code> as the same function,
            because its dependency list is empty. Those props pass{" "}
            <JsApi name="Object.is" n={1} />, so Doc #1 and Doc #2 do not render. The
            status is keyed to the row render, so it does not start again. They stay on
            Deselected, and the check stays grey.
          </p>
          <p>
            Press the grey check on Doc #1. That row's <code>selected</code> prop turns
            true, so the check turns green. The row renders. The
            status mounts again, prints Checking status..., then Selected. The other
            files stay grey. Press the green check again. It turns grey, and the status
            checks once more before it settles on Deselected.
          </p>
        </>
      ),
    },
    {
      id: "inline",
      label: "New select function",
      tease: "A new select function on every group click rechecks files that stayed in the list.",
      tryThis: "Press Doc. Doc #1 and Doc #2 print Checking status... even though they stayed.",
      code: inlineCode.text,
      focus: inlineCode.focus,
      explanation: (
        <>
          <p>
            The rows are still wrapped in <code>memo</code>. Inside the list, the parent
            passes{" "}
            <code>{"onSelect={() => setSelectedId(...)}"}</code>. That arrow is a new
            function every time the group changes. <JsApi name="Object.is" n={1} />{" "}
            fails, so <code>memo</code> gives up. Each file that stayed renders again.
            The status remounts, prints Checking status..., then Deselected. The checks
            stay grey, because the selection did not change. That is the toll of
            clicking through the groups. A row that stays keeps its render count, and
            that count climbs.
          </p>
          <p>
            A row that leaves does not keep its count. Press Image after Doc. Doc #1
            and Doc #2 are no longer in the list, so React unmounts them. The number
            lives in a ref on that row. Unmounting throws the row away, ref included.
            Press All and those two mount as new rows, each starting at render 1.
            Image #3 was on screen the whole time, so its count does not go back to 1.
            A reset means the row was gone and came back. The new function is what
            makes a row that stayed climb. It is not what starts a returning row at 1.
          </p>
          <p>
            Pressing the check still selects the file you clicked, and a second press
            deselects it. The wasted status is the group click.
          </p>
        </>
      ),
      repair: {
        code: stableCode.text,
        focus: stableCode.focus,
        tryThis: "Press Doc. Doc #1 and Doc #2 stay on Deselected.",
        explanation: (
          <>
            <p>
              <code>useCallback</code> keeps <code>onSelect</code> as the same function
              across group clicks. The rows are wrapped in <code>memo</code>. A file
              that stays in the list has the same <code>selected</code> value. Those
              props pass <JsApi name="Object.is" n={1} />. The parent count climbs. The
              file does not recheck.
            </p>
            <p>
              A file that the group removes still comes back at render 1. React
              unmounted that row, so the ref that held the count is gone. The fix
              changes whether a row that stayed has to render. It does not keep a
              removed row's count.
            </p>
            <p>
              The broken version passed a new arrow on every group click, so{" "}
              <code>memo</code> had nothing stable to compare. The same function is the
              fix.
            </p>
          </>
        ),
      },
    },
    {
      id: "bare",
      label: "No memo",
      tease: "Without memo, a group click rechecks every file that stayed.",
      tryThis: "Press Doc. The select function is stable, and Doc #1 and Doc #2 still recheck.",
      code: bareCode.text,
      focus: bareCode.focus,
      explanation: (
        <>
          <p>
            There is no <code>memo</code>. <code>useCallback</code> keeps{" "}
            <code>onSelect</code> stable, and it still does not matter. The parent
            rendered, so React calls each remaining row. The check runs again and
            prints Checking status... before it settles on Deselected.
          </p>
          <p>
            Skipping a row is an opt-in. A stable function prop does nothing until the
            row asks React to compare its props.
          </p>
        </>
      ),
      repair: {
        code: stableCode.text,
        focus: stableCode.focus,
        tryThis: "Press Doc. Doc #1 and Doc #2 stay on Deselected.",
        explanation: (
          <>
            <p>
              Each row is wrapped in <code>memo</code>, and <code>onSelect</code> comes
              from <code>useCallback</code>. Press Doc. The parent renders. Doc #1 and
              Doc #2 are still deselected, so their props pass{" "}
              <JsApi name="Object.is" n={1} /> and those rows do not run.
            </p>
            <p>
              The broken version was an ordinary function. A parent render always called
              it. <code>memo</code> is the opt-in that lets it skip.
            </p>
          </>
        ),
      },
    },
    {
      id: "usememo",
      label: "useMemo",
      tease: "The filter runs again only when the query changes.",
      fixedFirst: true,
      tryThis: "Increase times visited and watch the calc count.",
      code: plainFilterCode.text,
      focus: plainFilterCode.focus,
      explanation: (
        <>
          <p>
            The filter runs in the component body. Changing times visited climbs the
            count even though the query is the same. The line under the list says what
            you wanted. This version filters again anyway.
          </p>
          <p>
            For eight cities this work is cheap. The count is there so you can see the
            difference from <code>useMemo</code> without pretending the list was slow.
          </p>
        </>
      ),
      repair: {
        code: memoFilterCode.text,
        focus: memoFilterCode.focus,
        tryThis: "Increase times visited, then change the query.",
        explanation: (
          <>
            <p>
              The filter sits inside <code>useMemo</code>. Changing times visited
              renders this component again and does not change <code>query</code>. React
              keeps the previous list, so the "filter ran" count stays. That is the line
              under the list: the list should not be filtered again when the times
              visited change. Change the query and the count moves, because that
              dependency changed.
            </p>
            <p>
              <code>useMemo</code> is a hint. React may throw the cache away. Don't put
              a required side effect in there. The count on this stage is a measurement,
              not something the filter needs in order to be correct.
            </p>
          </>
        ),
      },
    },
  ],
};
