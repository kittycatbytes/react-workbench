import { useId, useRef, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { RenderMark, useConsoleLines, WarningList } from "../workbench/bits.tsx";
import { JsApi } from "../workbench/JsApi.tsx";

function ControlledField() {
  const id = useId();
  const [name, setName] = useState("");
  return (
    <div className="widget stack">
      <RenderMark name="field" />
      <label htmlFor={id}>Name</label>
      <input
        id={id}
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <p className="hint" data-testid="length">
        {name.length} characters
      </p>
    </div>
  );
}

function UncontrolledField() {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState("(not read yet)");
  return (
    <div className="widget stack">
      <RenderMark name="field" />
      <label htmlFor={id}>Name</label>
      <input id={id} type="text" ref={ref} defaultValue="" />
      <button type="button" onClick={() => setSubmitted(ref.current?.value || "(empty)")}>
        Read value
      </button>
      <p className="readout">
        Read <strong data-testid="submitted">{submitted}</strong>
      </p>
    </div>
  );
}

function FrozenField({ repaired }: { repaired: boolean }) {
  const id = useId();
  const [name, setName] = useState("Ada");
  const lines = useConsoleLines();
  if (repaired) {
    return (
      <div className="widget stack">
        <RenderMark name="field" />
        <label htmlFor={id}>Name</label>
        <input
          id={id}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <p className="hint" data-testid="length">
          {name.length} characters
        </p>
      </div>
    );
  }
  return (
    <div className="widget stack">
      <RenderMark name="field" />
      <label htmlFor={id}>Name</label>
      <input id={id} type="text" value="you cannot edit this" />
      <WarningList lines={lines} />
    </div>
  );
}

function FlipField() {
  const id = useId();
  const [name, setName] = useState<string | undefined>(undefined);
  const lines = useConsoleLines();
  const controlled = name !== undefined;
  return (
    <div className="widget stack">
      <RenderMark name="field" />
      <label htmlFor={id}>Name</label>
      <input
        id={id}
        type="text"
        {...(controlled ? { value: name } : { defaultValue: "start here" })}
        onChange={(event) => {
          if (controlled) setName(event.target.value);
        }}
      />
      <button type="button" onClick={() => setName("now controlled")} disabled={controlled}>
        Make it controlled
      </button>
      <p className="hint" data-testid="mode">
        {controlled ? "Controlled. Typing renders." : "Uncontrolled. Typing does not render."}
      </p>
      <WarningList lines={lines} />
    </div>
  );
}

const controlledCode = sample`
  function ControlledField() {
    const id = useId();
    const [name, setName] = useState("");
    return (
      <>
        <label htmlFor={id}>Name</label>
        <input
          id={id}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <p>{name.length} characters</p>
      </>
    );
  }
`;

const uncontrolledCode = sample`
  function UncontrolledField() {
    const ref = useRef(null);
    const [submitted, setSubmitted] = useState("(not read yet)");
    return (
      <>
        <label>Name</label>
        <input ref={ref} defaultValue="" />
        <button onClick={() => setSubmitted(ref.current.value)}>
          Read value
        </button>
        <p>Read {submitted}</p>
      </>
    );
  }
`;

const frozenCode = sample`
  function FrozenField() {
    return (
      <>
        <label>Name</label>
        <input value="you cannot edit this" />
      </>
    );
  }
`;

const flipCode = sample`
  function FlipField() {
    const [name, setName] = useState(undefined);
    const controlled = name !== undefined;
    return (
      <>
        <label>Name</label>
        <input
          {...(controlled ? { value: name } : { defaultValue: "start here" })}
          onChange={(event) => {
            if (controlled) setName(event.target.value);
          }}
        />
        <button onClick={() => setName("now controlled")} disabled={controlled}>
          Make it controlled
        </button>
        <p>
          {controlled
            ? "Controlled. Typing renders."
            : "Uncontrolled. Typing does not render."}
        </p>
      </>
    );
  }
`;

const frozenFixed = sample`
  function FrozenField() {
    const [name, setName] = useState("Ada");
    return (
      <>
        <label>Name</label>
        <input value={name} onChange={(event) => setName(event.target.value)} /> /*focus*/
        <p>{name.length} characters</p>
      </>
    );
  }
`;

export function FormsDemo({ scenarioId, repaired }: DemoProps) {
  if (scenarioId === "uncontrolled") return <UncontrolledField />;
  if (scenarioId === "frozen") return <FrozenField repaired={repaired} />;
  if (scenarioId === "flip") return <FlipField />;
  return <ControlledField />;
}

export const formsLesson: Lesson = {
  id: "forms",
  kicker: "inputs",
  title: "Controlled and uncontrolled",
  blurb:
    "An input either takes its value from React state on every render, or keeps what the DOM has.",
  Demo: FormsDemo,
  scenarios: [
    {
      id: "controlled",
      label: "Controlled",
      tease: "The input shows state. Every keystroke writes state and renders.",
      tryThis: "Type a few letters.",
      code: controlledCode.text,
      focus: [2, 8, 9],
      explanation: (
        <>
          <p>
            <code>value</code> means the input shows React state, and nothing else.{" "}
            <code>onChange</code> writes the DOM event back into state. React renders,
            and the input shows the new state. That round trip is why the character
            count and the render mark move on every keystroke.
          </p>
          <p>
            <code>useId</code> makes the id the label points at. You do not invent a
            string, and two copies of this field on one page will not collide. The id
            stays for the life of the component.
          </p>
        </>
      ),
    },
    {
      id: "uncontrolled",
      label: "Uncontrolled",
      tease: "defaultValue sets the input once. The DOM keeps the text.",
      tryThis: "Type, watch the render mark, then read the value.",
      code: uncontrolledCode.text,
      focus: [6, 7],
      explanation: (
        <>
          <p>
            <code>defaultValue</code> sets the input once, when it mounts. After that
            the DOM keeps the text. Typing does not call setState, so the render mark
            stays still.
          </p>
          <p>
            Read value looks at <code>ref.current.value</code> and copies it into{" "}
            <code>submitted</code>. The line under the field updates on that click,
            not on the keystroke.
          </p>
          <p>
            Use this when you need the value at submit time and the rest of the screen
            does not care about each character.
          </p>
        </>
      ),
    },
    {
      id: "frozen",
      label: "Value and no onChange",
      tease: "React puts the string back on every render. Typing does not stick.",
      tryThis: "Try to type in the field.",
      code: frozenCode.text,
      focus: [2],
      explanation: (
        <>
          <p>
            <code>value</code> is set and there is no <code>onChange</code>. The input
            can only show that string. A keystroke changes the DOM, then React writes
            the string back.
          </p>
          <p>
            React logs a warning, and this stage repeats the first line of it under
            the field. If a locked field is what you meant, pass <JsApi name="readOnly" n={1} />{" "}
            as well. The warning is about an input that looks editable and is not.
          </p>
        </>
      ),
      repair: {
        code: frozenFixed.text,
        focus: frozenFixed.focus,
        tryThis: "Type in the field. The characters stay, and the count follows.",
        explanation: (
          <>
            <p>
              <code>value</code> still comes from state. <code>onChange</code> writes
              the next string with <code>setName</code>. A keystroke renders, and the
              input shows what you typed.
            </p>
            <p>
              The broken field had a <code>value</code> and nowhere for the keystroke
              to go. React put the old string back. The change handler is the missing
              half of a controlled input.
            </p>
          </>
        ),
      },
    },
    {
      id: "flip",
      label: "Switch mid-life",
      tease: "The field starts uncontrolled, then a string value takes over.",
      tryThis: "Type something, then press Make it controlled.",
      code: flipCode.text,
      focus: [6],
      explanation: (
        <>
          <p>
            The input starts with <code>defaultValue</code> and no <code>value</code>.
            That is uncontrolled, so the DOM owns the text and typing does not render.
          </p>
          <p>
            Make it controlled calls <code>setName("now controlled")</code>. The next
            render passes a string in <code>value</code>, and the input is controlled
            for the rest of its life. The text you typed is replaced by that state.
            React logs a warning when the switch happens. After that, typing renders,
            because <code>onChange</code> is writing state.
          </p>
          <p>
            Pick one mode when the input mounts. To reset an uncontrolled input,
            change its <code>key</code> so React remounts it.
          </p>
        </>
      ),
    },
  ],
};
