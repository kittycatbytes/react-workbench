import { useCallback, useEffect, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { CatchBoundary, RenderMark } from "../workbench/bits.tsx";

function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((value) => !value), []);
  return [on, toggle] as const;
}

function useSeconds(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return seconds;
}

function Lamp({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={on ? "lamp on" : "lamp"}
      aria-pressed={on}
      onClick={onToggle}
    >
      <span className="bulb" />
      {label}: {on ? "On" : "Off"}
    </button>
  );
}

function OneLamp() {
  const [on, toggle] = useToggle(false);
  const seconds = useSeconds(on);
  return (
    <div className="widget stack">
      <RenderMark name="panel" />
      <Lamp on={on} onToggle={toggle} label="Lamp" />
      <p className="readout">
        Lit for <strong data-testid="seconds">{seconds}</strong>s
      </p>
      <p className="hint">The count pauses while the lamp is off, and it keeps its place.</p>
    </div>
  );
}

function TwoLamps() {
  const [left, toggleLeft] = useToggle(false);
  const [right, toggleRight] = useToggle(true);
  return (
    <div className="widget stack">
      <RenderMark name="panel" />
      <div className="row">
        <Lamp on={left} onToggle={toggleLeft} label="Left" />
        <Lamp on={right} onToggle={toggleRight} label="Right" />
      </div>
      <p className="hint">Two calls to useToggle. Two pieces of state.</p>
    </div>
  );
}

function ConditionalHooks({ extra, repaired }: { extra: boolean; repaired: boolean }) {
  if (!repaired && extra) {
    // oxlint-disable-next-line react/rules-of-hooks -- the extra call is the failure this scenario shows
    useState(0);
  }
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Legal hook count: {count}
    </button>
  );
}

function BrokenHooks({ repaired }: { repaired: boolean }) {
  const [extra, setExtra] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className="widget stack">
      <button type="button" onClick={() => setExtra(true)} disabled={extra}>
        {repaired ? "Set the extra flag" : "Call an extra hook"}
      </button>
      {repaired && extra ? (
        <p className="hint">The flag is state from the first render. The hook list did not change.</p>
      ) : null}
      <CatchBoundary
        resetKey={String(resetKey)}
        title="Rules of hooks"
        onReset={() => {
          setExtra(false);
          setResetKey((value) => value + 1);
        }}
      >
        <ConditionalHooks extra={extra} repaired={repaired} />
      </CatchBoundary>
    </div>
  );
}

const customCode = sample`
  function useToggle(initial = false) {
    const [on, setOn] = useState(initial);
    const toggle = useCallback(() => setOn((value) => !value), []);
    return [on, toggle];
  }

  function useSeconds(active) {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
      if (!active) return;
      const id = setInterval(() => setSeconds((value) => value + 1), 1000);
      return () => clearInterval(id);
    }, [active]);
    return seconds;
  }

  function OneLamp() {
    const [on, toggle] = useToggle(false);
    const seconds = useSeconds(on);
    return (
      <>
        <button onClick={toggle}>Lamp: {on ? "On" : "Off"}</button>
        <p>Lit for {seconds}s</p>
        <p>The count pauses while the lamp is off, and it keeps its place.</p>
      </>
    );
  }
`;

const twoCode = sample`
  function TwoLamps() {
    const [left, toggleLeft] = useToggle(false);
    const [right, toggleRight] = useToggle(true);
    return (
      <>
        <button onClick={toggleLeft}>Left: {left ? "On" : "Off"}</button>
        <button onClick={toggleRight}>Right: {right ? "On" : "Off"}</button>
        <p>Two calls to useToggle. Two pieces of state.</p>
      </>
    );
  }
`;

const brokenCode = sample`
  function BrokenHooks() {
    const [extra, setExtra] = useState(false);
    return (
      <>
        <button onClick={() => setExtra(true)}>Call an extra hook</button>
        <ConditionalHooks extra={extra} />
      </>
    );
  }

  function ConditionalHooks({ extra }) {
    if (extra) {
      useState(0);
    }
    const [count, setCount] = useState(0);
    return (
      <button onClick={() => setCount((value) => value + 1)}>
        Legal hook count: {count}
      </button>
    );
  }
`;

const hooksFixed = sample`
  function ConditionalHooks() {
    const [extra, setExtra] = useState(false); /*focus*/
    const [count, setCount] = useState(0);
    return (
      <>
        <button onClick={() => setExtra(true)}>Set the extra flag</button>
        <button onClick={() => setCount((value) => value + 1)}>
          Legal hook count: {count}
        </button>
      </>
    );
  }
`;

export function HooksDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "two") return <TwoLamps />;
  if (scenarioId === "conditional") return <BrokenHooks repaired={repaired} />;
  return <OneLamp />;
}

export const hooksLesson: Lesson = {
  id: "hooks",
  kicker: "custom hooks",
  title: "Hooks are just functions",
  blurb:
    "A custom hook shares logic. It does not share state, and it has to run in the same order every render.",
  Demo: HooksDemo,
  scenarios: [
    {
      id: "custom",
      label: "Two custom hooks",
      tease: "useToggle and useSeconds are functions that call hooks.",
      tryThis: "Turn the lamp on, wait, then turn it off.",
      code: customCode.text,
      focus: [1, 7, 18, 19],
      explanation: (
        <>
          <p>
            <code>useToggle</code> and <code>useSeconds</code> are functions that call
            hooks. That is the whole definition of a custom hook. The names start with{" "}
            <code>use</code> so the linter can check them. This component calls both
            at the top, on every render, in the same order.
          </p>
          <p>
            The seconds hook owns its interval. Turning the lamp off changes{" "}
            <code>active</code>, the effect cleans up, and the interval stops. The
            count stays where it was. Turn the lamp on and the count continues.
          </p>
        </>
      ),
    },
    {
      id: "two",
      label: "Two calls, two states",
      tease: "The same hook does not share state between calls.",
      tryThis: "Toggle each lamp.",
      code: twoCode.text,
      focus: [2, 3],
      explanation: (
        <>
          <p>
            Both lamps call <code>useToggle</code>. Each call gets its own state.
            Custom hooks do not share data across components, and two calls in one
            component do not share either. There is no registry behind the function.
          </p>
          <p>
            If you want shared state, lift it or put it in context. The hook only
            shares the logic.
          </p>
        </>
      ),
    },
    {
      id: "conditional",
      label: "A conditional hook",
      tease: "Calling useState inside an if changes the hook list and React throws.",
      tryThis: "Press Call an extra hook. Then reset the boundary.",
      code: brokenCode.text,
      focus: [2, 3, 4],
      explanation: (
        <>
          <p>
            Hooks are stored as a list on the component, in call order. The first
            render, with the extra hook off, calls <code>useState</code> once. Turn
            the extra hook on and this component calls <code>useState</code> twice.
            React compares the list to the previous render, sees a different length,
            and throws.
          </p>
          <p>
            The boundary around the button catches that throw, so the rest of the
            workbench stays up. Reset boundary mounts a fresh component with a legal
            hook list. The same throw happens for a hook inside a loop, or after a
            conditional return.
          </p>
          <p>Call hooks at the top, every render, in the same order.</p>
        </>
      ),
      repair: {
        code: hooksFixed.text,
        focus: hooksFixed.focus,
        tryThis: "Press Set the extra flag, then press the count button.",
        explanation: (
          <>
            <p>
              Both <code>useState</code> calls sit at the top and run on every render.
              The button sets <code>extra</code>. It does not add a hook. The list
              React stored on the first render is the list on the next one.
            </p>
            <p>
              Press the count button after the flag. It still increments. The broken
              version called a new <code>useState</code> inside the <code>if</code>,
              and React threw because the list changed length.
            </p>
          </>
        ),
      },
    },
  ],
};
