import { Component, StrictMode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import {
  LogView,
  rememberInterval,
  useClearLeakedIntervals,
  useStableLog,
} from "../workbench/bits.tsx";
import { JsApi } from "../workbench/JsApi.tsx";

let leakSerial = 0;

function Ticker({ onLog }: { onLog: (line: string) => void }) {
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    onLog("effect: subscribed");
    const id = window.setInterval(() => setTicks((value) => value + 1), 1000);
    return () => {
      window.clearInterval(id);
      onLog("cleanup: unsubscribed");
    };
  }, [onLog]);
  return (
    <p className="readout">
      Ticks <strong data-testid="ticks">{ticks}</strong>
    </p>
  );
}

function CleanupScene() {
  const { lines, onLog } = useStableLog();
  const [show, setShow] = useState(true);
  return (
    <div className="stack">
      <div className="widget stack">
        <button type="button" onClick={() => setShow((value) => !value)}>
          {show ? "Unmount ticker" : "Mount ticker"}
        </button>
        {show ? <Ticker onLog={onLog} /> : <p className="hint">Ticker is unmounted.</p>}
      </div>
      <LogView lines={lines} />
    </div>
  );
}

type ClockProps = {
  seed: number;
  onLog: (line: string) => void;
};

class Clock extends Component<ClockProps, { ticks: number }> {
  state = { ticks: 0 };
  intervalId = 0;

  componentDidMount() {
    this.props.onLog("componentDidMount");
    this.intervalId = window.setInterval(() => {
      this.setState((current) => ({ ticks: current.ticks + 1 }));
    }, 1000);
  }

  componentDidUpdate(previous: ClockProps) {
    if (previous.seed !== this.props.seed) {
      this.props.onLog(`componentDidUpdate (${previous.seed} to ${this.props.seed})`);
    }
  }

  componentWillUnmount() {
    window.clearInterval(this.intervalId);
    this.props.onLog("componentWillUnmount");
  }

  render() {
    return (
      <p className="readout">
        Ticks <strong data-testid="ticks">{this.state.ticks}</strong>
      </p>
    );
  }
}

function ClassScene() {
  const { lines, onLog } = useStableLog();
  const [show, setShow] = useState(true);
  const [seed, setSeed] = useState(1);
  return (
    <div className="stack">
      <div className="widget stack">
        <p className="hint">Seed {seed}</p>
        <div className="row">
          <button type="button" onClick={() => setSeed((value) => value + 1)}>
            Bump seed
          </button>
          <button type="button" className="ghost" onClick={() => setShow((value) => !value)}>
            {show ? "Unmount clock" : "Mount clock"}
          </button>
        </div>
        {show ? <Clock seed={seed} onLog={onLog} /> : <p className="hint">Clock is unmounted.</p>}
      </div>
      <LogView lines={lines} />
    </div>
  );
}

function StaleCapture({ repaired }: { repaired: boolean }) {
  const [count, setCount] = useState(0);
  const [captured, setCaptured] = useState(0);
  useEffect(() => {
    setCaptured(count);
  }, repaired ? [count] : []);
  return (
    <div className="widget stack">
      <p className="readout">
        Live count <strong data-testid="live">{count}</strong>
      </p>
      <p className={captured === count ? "readout" : "toll"}>
        Captured in the effect <strong data-testid="captured">{captured}</strong>
      </p>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Increment
      </button>
      <p className="hint">
        {repaired
          ? "The effect lists count, so the captured number follows the live one."
          : "The effect lists no dependencies, so it never reads the new count."}
      </p>
    </div>
  );
}

function LeakyTicker({
  onLog,
  repaired,
}: {
  onLog: (line: string) => void;
  repaired: boolean;
}) {
  const [label] = useState(() => {
    leakSerial += 1;
    return String(leakSerial);
  });
  useEffect(() => {
    onLog(`interval ${label} started`);
    const id = window.setInterval(() => {
      onLog(`tick from interval ${label}`);
    }, 800);
    if (!repaired) {
      rememberInterval(id);
      return;
    }
    return () => {
      window.clearInterval(id);
      onLog(`cleanup: interval ${label} cleared`);
    };
  }, [label, onLog, repaired]);
  return (
    <p className="readout">
      Interval <strong>{label}</strong> is running.
    </p>
  );
}

function LeakScene({ repaired }: { repaired: boolean }) {
  const { lines, onLog } = useStableLog();
  const [show, setShow] = useState(true);
  useClearLeakedIntervals();
  return (
    <div className="stack">
      <div className="widget stack">
        <button type="button" onClick={() => setShow((value) => !value)}>
          {show ? "Unmount ticker" : "Mount ticker"}
        </button>
        {show ? (
          <LeakyTicker onLog={onLog} repaired={repaired} />
        ) : (
          <p className="hint">
            {repaired
              ? "Ticker is unmounted. The cleanup cleared the interval."
              : "Ticker is unmounted. The interval is not."}
          </p>
        )}
      </div>
      <LogView lines={lines} />
    </div>
  );
}

type CallBucket = { outside: number; inside: number };

function CallProbe({
  label,
  bucket,
  field,
  testId,
}: {
  label: string;
  bucket: CallBucket;
  field: keyof CallBucket;
  testId: string;
}) {
  bucket[field] += 1;
  return (
    <p className="readout">
      {label} <strong data-testid={testId}>{bucket[field]}</strong>
    </p>
  );
}

function DisplayProbe({
  label,
  count,
  testId,
}: {
  label: string;
  count: number;
  testId: string;
}) {
  return (
    <p className="readout">
      {label} <strong data-testid={testId}>{count}</strong>
    </p>
  );
}

function StrictScene({ repaired }: { repaired: boolean }) {
  const [bucket] = useState<CallBucket>(() => ({ outside: 0, inside: 0 }));
  const [generation, setGeneration] = useState(0);
  const shown = generation + 1;
  return (
    <div className="widget stack">
      <button type="button" onClick={() => setGeneration((value) => value + 1)}>
        Render again
      </button>
      <p className="hint">Parent renders {shown}</p>
      {repaired ? (
        <>
          <DisplayProbe label="Outside StrictMode" count={shown} testId="outside" />
          <StrictMode>
            <DisplayProbe label="Inside StrictMode" count={shown} testId="inside" />
          </StrictMode>
          <p className="hint">Both probes display the parent count. Neither one adds during render.</p>
        </>
      ) : (
        <>
          <CallProbe label="Outside StrictMode" bucket={bucket} field="outside" testId="outside" />
          <StrictMode>
            <CallProbe label="Inside StrictMode" bucket={bucket} field="inside" testId="inside" />
          </StrictMode>
        </>
      )}
    </div>
  );
}

type Note = { id: string; text: string; anchor?: boolean };

const OPENING: Note[] = [
  { id: "mon", text: "Monday. Draft the empty state." },
  { id: "tue", text: "Tuesday. The panel remembers its height." },
  { id: "wed", text: "Wednesday. Keep this note in view.", anchor: true },
];

const OLDER_COPY = [
  "Archived. The first sketch of the dock.",
  "Archived. Why the code panel takes the leftover height.",
  "Archived. A note from the review.",
  "Archived. The scroll position before this load.",
  "Archived. The empty state we threw away.",
  "Archived. Names for the three panels.",
];

function Thread({ layout }: { layout: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const before = useRef(0);
  const pending = useRef(false);
  const ready = useRef(false);
  const serial = useRef(0);
  const [notes, setNotes] = useState(OPENING);
  const [verdict, setVerdict] = useState("You are reading the marked note.");

  function anchorVisible() {
    const node = scroller.current;
    const anchor = node?.querySelector<HTMLElement>("[data-anchor]");
    if (!node || !anchor) return false;
    const box = node.getBoundingClientRect();
    const mark = anchor.getBoundingClientRect();
    return mark.top >= box.top - 2 && mark.bottom <= box.bottom + 2;
  }

  function restore() {
    const node = scroller.current;
    if (!node || !pending.current) return;
    node.scrollTop += node.scrollHeight - before.current;
    pending.current = false;
  }

  function loadOlder() {
    const node = scroller.current;
    if (!node) return;
    before.current = node.scrollHeight;
    pending.current = true;
    const batch = OLDER_COPY.map((text) => {
      serial.current += 1;
      return { id: `old-${serial.current}`, text };
    });
    setNotes((current) => [...batch, ...current]);
  }

  useLayoutEffect(() => {
    const node = scroller.current;
    if (!node) return;
    if (!ready.current) {
      node.scrollTop = node.scrollHeight;
      ready.current = true;
      return;
    }
    if (!pending.current) return;
    if (layout) restore();
    const next = anchorVisible()
      ? "The marked note stayed in view."
      : "The marked note was pushed out of view.";
    setVerdict((current) => (current === next ? current : next));
  }, [notes, layout]);

  useEffect(() => {
    if (layout || !pending.current) return;
    const timer = window.setTimeout(() => {
      restore();
      setVerdict("The note came back after paint. That jump is the frame useLayoutEffect skips.");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [notes, layout]);

  return (
    <div className="widget stack">
      <button type="button" onClick={loadOlder}>
        Load older notes
      </button>
      <div className="thread" ref={scroller} data-testid="thread">
        {notes.map((note) => (
          <p key={note.id} data-anchor={note.anchor ? "true" : undefined}>
            {note.text}
          </p>
        ))}
      </div>
      <p className="hint" data-testid="scroll-verdict">
        {verdict}
      </p>
    </div>
  );
}

const cleanupCode = sample`
  function Ticker({ onLog }) {
    const [ticks, setTicks] = useState(0);
    useEffect(() => {
      onLog("effect: subscribed"); //onLog defined off-screen /*focus*/
      const id = setInterval(() => setTicks((value) => value + 1), 1000);
      return () => {
        clearInterval(id); /*focus*/
        onLog("cleanup: unsubscribed"); /*focus*/
      };
    }, [onLog]);
    return <p>Ticks {ticks}</p>;
  }

  function CleanupScene() {
    const [show, setShow] = useState(true);
    return (
      <button onClick={() => setShow((value) => !value)}>
        {show ? "Unmount ticker" : "Mount ticker"}
      </button>
    );
  }
`;

const classCode = sample`
  class Clock extends Component {
    componentDidMount() {
      this.props.onLog("componentDidMount"); //onLog defined off-screen /*focus*/
      this.intervalId = setInterval(() => {
        this.setState((state) => ({ ticks: state.ticks + 1 }));
      }, 1000);
    }
    componentDidUpdate(previous) {
      if (previous.seed !== this.props.seed) {
        this.props.onLog("componentDidUpdate"); /*focus*/
      }
    }
    componentWillUnmount() {
      clearInterval(this.intervalId); /*focus*/
      this.props.onLog("componentWillUnmount"); /*focus*/
    }
    render() {
      return <p>Ticks {this.state.ticks}</p>;
    }
  }

  function ClassScene() {
    const [seed, setSeed] = useState(1);
    const [show, setShow] = useState(true);
    return (
      <>
        <p>Seed {seed}</p>
        <button onClick={() => setSeed((value) => value + 1)}>Bump seed</button>
        <button onClick={() => setShow((value) => !value)}>
          {show ? "Unmount clock" : "Mount clock"}
        </button>
      </>
    );
  }
`;

const staleCode = sample`
  function StaleCapture() {
    const [count, setCount] = useState(0);
    const [captured, setCaptured] = useState(0);
    useEffect(() => {
      setCaptured(count); /*focus*/
    }, []); /*focus*/
    return (
      <>
        <p>Live count {count}</p>
        <p>Captured in the effect {captured}</p>
        <button onClick={() => setCount((value) => value + 1)}>Increment</button>
        <p>The effect lists no dependencies, so it never reads the new count.</p>
      </>
    );
  }
`;

const leakCode = sample`
  function LeakyTicker({ onLog }) {
    useEffect(() => {
      onLog("interval started"); //onLog defined off-screen
      const id = setInterval(() => onLog("tick"), 800);
      rememberInterval(id); //rememberInterval defined off-screen /*focus*/
      // no cleanup function
    }, [onLog]);
    return <p>Interval {label} is running.</p>; //label defined off-screen
  }

  function LeakScene() {
    const [show, setShow] = useState(true);
    return (
      <button onClick={() => setShow((value) => !value)}>
        {show ? "Unmount ticker" : "Mount ticker"}
      </button>
    );
  }
`;

const strictCode = sample`
  function CallProbe({ label, bucket, field }) {
    bucket[field] += 1; /*focus*/
    return <p>{label} {bucket[field]}</p>;
  }

  function StrictScene() {
    const [bucket] = useState(() => ({ outside: 0, inside: 0 }));
    const [generation, setGeneration] = useState(0);
    return (
      <>
        <button onClick={() => setGeneration((value) => value + 1)}>
          Render again
        </button>
        <p>Parent renders {generation + 1}</p>
        <CallProbe label="Outside StrictMode" bucket={bucket} field="outside" />
        <StrictMode> /*focus*/
          <CallProbe label="Inside StrictMode" bucket={bucket} field="inside" />
        </StrictMode>
      </>
    );
  }
`;

const layoutCode = sample`
  function NotesThread() {
    const scroller = useRef(null);
    const before = useRef(0);
    const [notes, setNotes] = useState(latest); //latest defined off-screen

    function loadOlder() {
      before.current = scroller.current.scrollHeight; /*focus*/
      setNotes((current) => [...older, ...current]); //older defined off-screen
    }

    useLayoutEffect(() => {
      const node = scroller.current;
      node.scrollTop += node.scrollHeight - before.current; /*focus*/
    }, [notes]);

    return (
      <>
        <button onClick={loadOlder}>Load older notes</button>
        <div className="thread" ref={scroller}>
          {notes.map((note) => <p key={note.id}>{note.text}</p>)}
        </div>
        <p>You are reading the marked note.</p>
      </>
    );
  }
`;

const passiveCode = sample`
  function NotesThread() {
    const scroller = useRef(null);
    const before = useRef(0);
    const [notes, setNotes] = useState(latest); //latest defined off-screen

    function loadOlder() {
      before.current = scroller.current.scrollHeight;
      setNotes((current) => [...older, ...current]); //older defined off-screen
    }

    useEffect(() => {
      const node = scroller.current;
      node.scrollTop += node.scrollHeight - before.current; /*focus*/
    }, [notes]);

    return (
      <>
        <button onClick={loadOlder}>Load older notes</button>
        <div className="thread" ref={scroller}>
          {notes.map((note) => <p key={note.id}>{note.text}</p>)}
        </div>
        <p>You are reading the marked note.</p>
      </>
    );
  }
`;

const strictFixed = sample`
  function CallProbe({ count }) {
    return <strong>{count}</strong>; /*focus*/
  }

  function StrictScene() {
    const [generation, setGeneration] = useState(0);
    const shown = generation + 1; /*focus*/
    return (
      <>
        <button onClick={() => setGeneration((value) => value + 1)}>
          Render again
        </button>
        <p>Parent renders {shown}</p>
        <CallProbe label="Outside StrictMode" count={shown} />
        <StrictMode>
          <CallProbe label="Inside StrictMode" count={shown} />
        </StrictMode>
        <p>Both probes display the parent count. Neither one adds during render.</p>
      </>
    );
  }
`;

const staleFixed = sample`
  function StaleCapture() {
    const [count, setCount] = useState(0);
    const [captured, setCaptured] = useState(0);
    useEffect(() => {
      setCaptured(count); /*focus*/
    }, [count]); /*focus*/
    return (
      <>
        <p>Live count {count}</p>
        <p>Captured in the effect {captured}</p>
        <button onClick={() => setCount((value) => value + 1)}>Increment</button>
        <p>The effect lists count, so the captured number follows the live one.</p>
      </>
    );
  }
`;

const leakFixed = sample`
  function LeakyTicker({ onLog }) {
    useEffect(() => {
      onLog("interval started"); //onLog defined off-screen
      const id = setInterval(() => onLog("tick"), 800);
      return () => { /*focus*/
        clearInterval(id); /*focus*/
        onLog("cleanup: unsubscribed");
      };
    }, [onLog]);
    return <p>Interval {label} is running.</p>; //label defined off-screen
  }

  function LeakScene() {
    const [show, setShow] = useState(true);
    return (
      <button onClick={() => setShow((value) => !value)}>
        {show ? "Unmount ticker" : "Mount ticker"}
      </button>
    );
  }
`;

export function EffectsDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "class") return <ClassScene />;
  if (scenarioId === "stale") return <StaleCapture repaired={repaired} />;
  if (scenarioId === "leak") return <LeakScene repaired={repaired} />;
  if (scenarioId === "strict") return <StrictScene repaired={repaired} />;
  if (scenarioId === "layout") return <Thread layout />;
  if (scenarioId === "passive") return <Thread layout={false} />;
  return <CleanupScene />;
}

export const effectsLesson: Lesson = {
  id: "effects",
  kicker: "useEffect",
  title: "Effects and lifecycles",
  blurb:
    "Effects subscribe after paint. Class lifecycle methods are the older names for mount, update, and unmount.",
  Demo: EffectsDemo,
  scenarios: [
    {
      id: "cleanup",
      label: "Cleanup on unmount",
      tease: "The effect subscribes, and the returned function clears the interval.",
      tryThis: "Turn the ticker off and watch the log stop.",
      code: cleanupCode.text,
      focus: cleanupCode.focus,
      explanation: (
        <>
          <p>
            The effect runs after the ticker paints. It starts one interval and returns
            a cleanup function. That cleanup is the unmount step for this effect: it
            runs when the ticker leaves the stage, and it clears the interval.
          </p>
          <p>
            Unmount the ticker. The log should say unsubscribed, and then go quiet.
            Mount it again and you get one new subscription, still ticking once a second.
          </p>
          <p>
            A dependency-based effect also runs its cleanup before the effect runs
            again. <code>componentWillUnmount</code> does not do that. Cleanup covers
            the next run, not only the final unmount.
          </p>
        </>
      ),
    },
    {
      id: "class",
      label: "Class lifecycle methods",
      tease: "componentDidMount, componentDidUpdate, and componentWillUnmount on a real class.",
      tryThis: "Bump the seed, then unmount the clock.",
      code: classCode.text,
      focus: classCode.focus,
      explanation: (
        <>
          <p>
            This clock is a class component. <code>componentDidMount</code> starts the
            interval after the first render. <code>componentWillUnmount</code> clears
            it when the clock leaves the stage.
          </p>
          <p>
            Bump the seed. <code>componentDidUpdate</code> runs because the props
            changed, and the log says so. The interval also calls <code>setState</code>{" "}
            every second, which updates the class too, but the log ignores those. It
            only records a seed change. Otherwise the log would fill with ticks.
          </p>
          <p>
            The hooks ticker next door maps mount and unmount onto one effect. Update
            maps onto an effect whose dependency list includes the value you care about.
          </p>
        </>
      ),
    },
    {
      id: "stale",
      label: "Missing dependency",
      tease: "An empty dependency list freezes the count the effect saw.",
      tryThis: "Increment the live count. The captured count stays.",
      code: staleCode.text,
      focus: staleCode.focus,
      explanation: (
        <>
          <p>
            The effect copies <code>count</code> into <code>captured</code>, and its
            dependency list is empty. React runs it after the first paint and never
            again.
          </p>
          <p>
            Increment the live count. That state lives in the component, so the live
            number moves. The effect does not run, so the captured number stays at the
            first value.
          </p>
          <p>
            Put <code>count</code> in the dependency list and the effect runs after
            every change. The empty list is a promise: this effect does not read
            anything that changes. Here the promise is a lie, and the captured number
            is the evidence.
          </p>
        </>
      ),
      repair: {
        code: staleFixed.text,
        focus: staleFixed.focus,
        tryThis: "Increment the live count. The captured count follows it.",
        explanation: (
          <>
            <p>
              <code>count</code> is in the dependency list. Increment it and React runs
              the effect again, after that render. The captured number moves with the
              live one.
            </p>
            <p>
              The empty list was the bug. It promised the effect did not read anything
              that changes, and then it read <code>count</code>. Listing the value you
              read is the fix.
            </p>
          </>
        ),
      },
    },
    {
      id: "leak",
      label: "No cleanup",
      tease: "Unmounting the ticker leaves the interval running.",
      tryThis: "Unmount the ticker, wait a second, then mount it again.",
      code: leakCode.text,
      focus: leakCode.focus,
      explanation: (
        <>
          <p>
            This effect starts an interval and returns nothing. Unmounting the ticker
            removes it from the screen and leaves the timer alone. Ticks keep arriving
            in the log, which lives in the parent.
          </p>
          <p>
            Mount the ticker again. A second interval starts. You now get ticks from
            both ids. That is the leak: each visit adds a timer, and nothing removes
            the old one.
          </p>
          <p>
            Leaving this scenario clears those timers from here, so they do not follow
            you into the next lesson. The cleanup function in the first scenario is
            what would have done that on unmount.
          </p>
        </>
      ),
      repair: {
        code: leakFixed.text,
        focus: leakFixed.focus,
        tryThis: "Unmount the ticker and watch the log go quiet.",
        explanation: (
          <>
            <p>
              The effect still starts the interval. It also returns a cleanup function.
              Unmount the ticker and that function clears the interval. The log records
              the cleanup, then stops.
            </p>
            <p>
              Mount it again and you get one new interval, not a second one stacked on
              the first. The cleanup is what the broken version was missing.
            </p>
          </>
        ),
      },
    },
    {
      id: "strict",
      label: "Strict Mode",
      tease: "In development, a child of StrictMode renders twice. The second pass is the one you see.",
      tryThis: "Compare the two numbers, then press Render again.",
      code: strictCode.text,
      focus: strictCode.focus,
      explanation: (
        <>
          <p>
            Each probe adds 1 to a plain object while it renders. That object is not
            state, so React does not reset it between passes. The number on screen is
            how many times the function actually ran.
          </p>
          <p>
            In development, React renders a component inside <code>StrictMode</code>,
            discards that pass, and renders it again. The first paint shows 2 inside
            and 1 outside. Press Render again. The parent renders once. The outside
            number adds 1. The inside number adds 2.
          </p>
          <p>
            The discarded pass does not keep state. It does re-run the function, so a
            side effect in the body happens twice. The reducer lesson is that same
            extra pass, inside <code>useReducer</code>. The rest of this workbench
            leaves Strict Mode off, so those lessons run once. A production build
            skips the extra pass.
          </p>
        </>
      ),
      repair: {
        code: strictFixed.text,
        focus: strictFixed.focus,
        tryThis: "Press Render again. The two numbers stay equal.",
        explanation: (
          <>
            <p>
              The probes only display a number the parent computed once. They do not
              add to anything while rendering. <code>StrictMode</code> still renders
              the inside probe twice in development and still throws the first pass
              away. Both passes read the same count, so the numbers match.
            </p>
            <p>
              Press Render again. The parent renders once, and both numbers go up by
              1. The broken version did the adding inside the probe, on an object
              React does not reset. Moving that work out of the render is the fix.
              The extra pass can still happen. It no longer changes anything you can
              see.
            </p>
          </>
        ),
      },
    },
    {
      id: "layout",
      label: "useLayoutEffect",
      tease: "Loading older notes keeps the one you were reading in place.",
      tryThis: "Press Load older notes. The marked note should not move.",
      code: layoutCode.text,
      focus: layoutCode.focus,
      explanation: (
        <>
          <p>
            <code>useLayoutEffect</code> runs after React updates the DOM and before
            the browser paints. Load older notes inserts rows above the one you are
            reading. The scroll position is still the old number, so that note would
            slide out of the window. The layout effect adds the height of the new
            rows to <JsApi name="scrollTop" n={1} /> before paint, and the marked note stays
            where it was.
          </p>
          <p>
            You cannot measure those rows during render. They have to be in the DOM
            first. A chat loading history above the message you are on, and a menu
            that flips so it stays on screen, are the same situation. The correction
            has to land before the user sees the frame.
          </p>
        </>
      ),
    },
    {
      id: "passive",
      label: "useEffect after paint",
      tease: "The same scroll correction waits until after paint, so the list jumps.",
      tryThis: "Press Load older notes and watch the marked note leave, then come back.",
      code: passiveCode.text,
      focus: passiveCode.focus,
      explanation: (
        <>
          <p>
            <code>useEffect</code> runs after the browser paints. The list is drawn
            first with the old scroll position, so the marked note leaves the window.
            This stage holds that frame so you can see it. The effect then applies
            the same correction, and the note comes back.
          </p>
          <p>
            In an app that round trip is a single paint, and a single paint is enough
            to notice. Subscriptions and fetching belong in <code>useEffect</code>.
            Measuring the DOM to correct what the user is about to see belongs in{" "}
            <code>useLayoutEffect</code>.
          </p>
        </>
      ),
    },
  ],
};
