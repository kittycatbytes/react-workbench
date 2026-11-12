import { useLayoutEffect, useRef, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { RenderMark } from "../workbench/bits.tsx";
import { JsApi } from "../workbench/JsApi.tsx";

function RefDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const clicks = useRef(0);
  const [shown, setShown] = useState(0);
  return (
    <div className="widget stack">
      <RenderMark name="panel" />
      <label className="stack">
        <span className="hint">A field the ref can focus</span>
        <input ref={inputRef} type="text" defaultValue="" aria-label="Note" />
      </label>
      <div className="row">
        <button type="button" onClick={() => inputRef.current?.focus()}>
          Focus the field
        </button>
        <button
          type="button"
          onClick={() => {
            clicks.current += 1;
          }}
        >
          Track a click
        </button>
        <button type="button" className="ghost" onClick={() => setShown(clicks.current)}>
          Read the ref
        </button>
      </div>
      <p className="readout">
        Last read <strong data-testid="shown">{shown}</strong>
      </p>
    </div>
  );
}

function StateClicks() {
  const [clicks, setClicks] = useState(0);
  return (
    <div className="widget stack">
      <RenderMark name="panel" />
      <p className="figure" data-testid="clicks">{clicks}</p>
      <button type="button" onClick={() => setClicks((value) => value + 1)}>
        Track a click
      </button>
    </div>
  );
}

function RefDuringRender({ repaired }: { repaired: boolean }) {
  const clicks = useRef(0);
  const [shown, setShown] = useState(0);
  const [other, setOther] = useState(0);
  const held = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const node = held.current;
    if (!node || repaired) return;
    node.textContent = `Ref holds ${clicks.current}`;
    node.className = "readout";
  });
  return (
    <div className="widget stack">
      <RenderMark name="panel" />
      <p className="readout">
        Painted from the {repaired ? "state" : "ref"}{" "}
        <strong data-testid="painted">{repaired ? shown : clicks.current}</strong>
      </p>
      <p className="readout" ref={held}>
        Ref holds {repaired ? shown : clicks.current}
      </p>
      <p className="hint">Other renders: {other}</p>
      <div className="row">
        <button
          type="button"
          onClick={() => {
            if (repaired) {
              setShown((value) => value + 1);
              return;
            }
            clicks.current += 1;
            const node = held.current;
            if (!node) return;
            node.textContent = `Ref holds ${clicks.current}`;
            node.className = "toll";
          }}
        >
          Track a click
        </button>
        <button type="button" className="ghost" onClick={() => setOther((value) => value + 1)}>
          Other render
        </button>
      </div>
    </div>
  );
}

const refCode = sample`
  function RefDemo() {
    const inputRef = useRef(null);
    const clicks = useRef(0); /*focus*/
    const [shown, setShown] = useState(0);
    return (
      <>
        <label>A field the ref can focus</label>
        <input ref={inputRef} />
        <button onClick={() => inputRef.current?.focus()}>Focus the field</button> /*focus*/
        <button onClick={() => { clicks.current += 1; }}>Track a click</button> /*focus*/
        <button onClick={() => setShown(clicks.current)}>Read the ref</button>
        <p>Last read {shown}</p>
      </>
    );
  }
`;

const stateCode = sample`
  function StateClicks() {
    const [clicks, setClicks] = useState(0); /*focus*/
    return (
      <>
        <p>{clicks}</p>
        <button onClick={() => setClicks((value) => value + 1)}>
          Track a click
        </button>
      </>
    );
  }
`;

const duringCode = sample`
  function RefDuringRender() {
    const clicks = useRef(0);
    const [other, setOther] = useState(0);
    return (
      <>
        <p>Painted from the ref {clicks.current}</p> /*focus*/
        <p>Ref holds {clicks.current}</p>
        <p>Other renders: {other}</p>
        <button onClick={() => { clicks.current += 1; }}>Track a click</button>
        <button onClick={() => setOther((value) => value + 1)}>Other render</button>
      </>
    );
  }
`;

const duringFixed = sample`
  function RefDuringRender() {
    const [shown, setShown] = useState(0); /*focus*/
    const [other, setOther] = useState(0);
    return (
      <>
        <p>Painted from the state {shown}</p>
        <p>Ref holds {shown}</p>
        <p>Other renders: {other}</p>
        <button onClick={() => setShown((value) => value + 1)}>
          Track a click
        </button>
        <button onClick={() => setOther((value) => value + 1)}>Other render</button>
      </>
    );
  }
`;

export function RefsDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "state") return <StateClicks />;
  if (scenarioId === "during") return <RefDuringRender repaired={repaired} />;
  return <RefDemo />;
}

export const refsLesson: Lesson = {
  id: "refs",
  kicker: "useRef",
  title: "Values that skip rendering",
  blurb: "A ref holds a mutable value, or a DOM node, without scheduling a render.",
  Demo: RefsDemo,
  scenarios: [
    {
      id: "ref",
      label: "Node and click count",
      tease: "Focus and tracking both write to a ref. Neither one renders.",
      tryThis: "Focus the field, track a few clicks, then read the ref.",
      code: refCode.text,
      focus: refCode.focus,
      explanation: (
        <>
          <p>
            The focus button writes to <code>inputRef.current</code> and calls{" "}
            <JsApi name="focus()" n={1} />. That touches the DOM node. It does not
            call a setState, so the render mark stays put.
          </p>
          <p>
            Track a click increments <code>clicks.current</code>. A ref is a box that
            survives renders and does not schedule one. The "last read" line stays at
            0 until you press Read the ref, which copies the box into state. That
            copy is why the read button renders and the track button does not.
          </p>
        </>
      ),
    },
    {
      id: "state",
      label: "The same clicks in state",
      tease: "Every click renders, because the screen is showing the number.",
      tryThis: "Track clicks and watch the render mark.",
      code: stateCode.text,
      focus: stateCode.focus,
      explanation: (
        <>
          <p>
            Same clicks, stored with <code>useState</code>. Every click schedules a
            render, the number on screen moves, and the render mark climbs.
          </p>
          <p>
            Use state when the screen needs the new value. Use a ref when you need to
            remember something, or point at a DOM node, and the screen does not need
            to paint it.
          </p>
        </>
      ),
    },
    {
      id: "during",
      label: "Read the ref while rendering",
      tease: "The paragraph keeps the old number until something else renders.",
      tryThis: "Track three clicks, then press Other render.",
      code: duringCode.text,
      focus: duringCode.focus,
      explanation: (
        <>
          <p>
            The paragraph reads <code>clicks.current</code> while rendering. Track a
            click changes the ref and turns Ref holds red. React has no reason to
            render, so the painted number stays put.
          </p>
          <p>
            Other render updates unrelated state. That render reads the ref, and the
            paragraph catches up in one jump. Three quiet clicks and then one render
            can paint 3.
          </p>
          <p>If the screen should update on the click, that value belongs in state.</p>
        </>
      ),
      repair: {
        code: duringFixed.text,
        focus: duringFixed.focus,
        tryThis: "Track a click. The paragraph updates on that click.",
        explanation: (
          <>
            <p>
              The number is state. Track a click calls <code>setShown</code>, React
              renders, and the paragraph shows the new number immediately.
            </p>
            <p>
              The broken version wrote a ref and read it during render. The write did
              not schedule a render, so the paragraph waited for some other update.
              State is the fix when the screen is supposed to show the number.
            </p>
          </>
        ),
      },
    },
  ],
};
