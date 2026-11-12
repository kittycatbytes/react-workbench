import { useEffect, useState } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { CatchBoundary } from "../workbench/bits.tsx";
import { JsApi } from "../workbench/JsApi.tsx";

function RenderChild({ boom }: { boom: boolean }) {
  if (boom) throw new Error("Render failed in the child.");
  return <p className="hint">The child rendered.</p>;
}

function RenderScene() {
  const [boom, setBoom] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className="widget stack">
      <CatchBoundary
        resetKey={String(resetKey)}
        title="Render error"
        onReset={() => {
          setBoom(false);
          setResetKey((value) => value + 1);
        }}
      >
        <RenderChild boom={boom} />
        <button type="button" onClick={() => setBoom(true)}>
          Throw during render
        </button>
      </CatchBoundary>
    </div>
  );
}

function EventScene() {
  const [windowMessage, setWindowMessage] = useState("none yet");
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      setWindowMessage(event.message);
      event.preventDefault();
    };
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);
  return (
    <div className="widget stack">
      <p className="hint" data-testid="window-error">
        Window error: {windowMessage}
      </p>
      <CatchBoundary
        resetKey={String(resetKey)}
        title="Event error"
        onReset={() => setResetKey((value) => value + 1)}
      >
        <button
          type="button"
          onClick={() => {
            throw new Error("Click handler failed.");
          }}
        >
          Throw in the click handler
        </button>
      </CatchBoundary>
    </div>
  );
}

function EffectChild({ arm }: { arm: boolean }) {
  useEffect(() => {
    if (arm) throw new Error("Effect failed in the child.");
  }, [arm]);
  return <p className="hint">Effect child is mounted.</p>;
}

function EffectScene() {
  const [arm, setArm] = useState(false);
  const [windowMessage, setWindowMessage] = useState("none yet");
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      setWindowMessage(event.message);
      event.preventDefault();
    };
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);
  return (
    <div className="widget stack">
      <p className="hint" data-testid="window-error">
        Window error: {windowMessage}
      </p>
      <button type="button" onClick={() => setArm(true)}>
        Throw in the effect
      </button>
      <CatchBoundary
        resetKey={String(resetKey)}
        title="Effect error"
        onReset={() => {
          setArm(false);
          setResetKey((value) => value + 1);
        }}
      >
        <EffectChild arm={arm} />
      </CatchBoundary>
    </div>
  );
}

const renderCode = sample`
  class CatchBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
      return { error };
    }
    componentDidCatch(error) {
      console.error(error);
    }
    render() {
      if (this.state.error) return <p>{this.state.error.message}</p>;
      return this.props.children;
    }
  }

  function RenderChild({ boom }) {
    if (boom) throw new Error("Render failed in the child.");
    return <p>The child rendered.</p>;
  }

  function RenderScene() {
    const [boom, setBoom] = useState(false);
    return (
      <button onClick={() => setBoom(true)}>Throw during render</button>
    );
  }
`;

const eventCode = sample`
  function EventScene() {
    const [windowMessage, setWindowMessage] = useState("none yet");
    return (
      <>
        <p>Window error: {windowMessage}</p>
        <CatchBoundary> //CatchBoundary defined off-screen
          <button
            onClick={() => {
              throw new Error("Click handler failed.");
            }}
          >
            Throw in the click handler
          </button>
        </CatchBoundary>
      </>
    );
  }
`;

const effectCode = sample`
  function EffectChild({ arm }) {
    useEffect(() => {
      if (arm) throw new Error("Effect failed in the child.");
    }, [arm]);
    return <p>Effect child is mounted.</p>;
  }

  function EffectScene() {
    const [windowMessage, setWindowMessage] = useState("none yet");
    const [arm, setArm] = useState(false);
    return (
      <>
        <p>Window error: {windowMessage}</p>
        <button onClick={() => setArm(true)}>Throw in the effect</button>
        <EffectChild arm={arm} />
      </>
    );
  }
`;

export function ErrorsDemo({ scenarioId }: DemoProps) {
  if (scenarioId === "event") return <EventScene />;
  if (scenarioId === "effect") return <EffectScene />;
  return <RenderScene />;
}

export const errorsLesson: Lesson = {
  id: "errors",
  kicker: "error boundary",
  title: "What a boundary can catch",
  blurb: "A class boundary catches a throw during render and a throw in an effect. A click handler takes a different path.",
  Demo: ErrorsDemo,
  scenarios: [
    {
      id: "render",
      label: "Throw during render",
      tease: "getDerivedStateFromError replaces the child with the fallback.",
      tryThis: "Throw during render, then reset the boundary.",
      code: renderCode.text,
      focus: [4, 5, 7, 16],
      explanation: (
        <>
          <p>
            <code>getDerivedStateFromError</code> and <code>componentDidCatch</code>{" "}
            run when a child throws during render. Function components still cannot
            be error boundaries. This one is a class, and the fallback replaces the
            child that threw.
          </p>
          <p>
            Press the button. The child throws on the next render. The boundary shows
            the message. The workbench around it never sees the throw. Reset boundary
            clears the flag and mounts a child that does not throw.
          </p>
        </>
      ),
    },
    {
      id: "event",
      label: "Throw in a click",
      tease: "The boundary stays quiet. The window hears the error.",
      tryThis: "Throw in the click handler and read the window line.",
      code: eventCode.text,
      focus: [4],
      explanation: (
        <>
          <p>
            The button throws inside <code>onClick</code>. That function is not part
            of rendering. The error boundary does not catch it, so the fallback does
            not replace the button.
          </p>
          <p>
            The window <JsApi name="error" n={1} label="Window error event" /> listener records the message on the stage.
            Without that listener, the throw reaches the browser and the stage looks
            unchanged. A <JsApi name="try/catch" n={2} /> around the call is how you handle an
            event. The boundary is the wrong tool for it.
          </p>
        </>
      ),
    },
    {
      id: "effect",
      label: "Throw in an effect",
      tease: "React 19 reports this throw to the boundary. The window line stays quiet.",
      tryThis: "Throw in the effect and compare the boundary with the window line.",
      code: effectCode.text,
      focus: [3],
      explanation: (
        <>
          <p>
            The effect throws after the child has painted. React 19 reports that
            error to the nearest error boundary. The fallback replaces the child.
            The window line stays on none yet, because the boundary handled the error.
          </p>
          <p>
            A click handler still misses the boundary. The previous scenario leaves
            the button in place and the window line takes the message. Reset boundary
            clears the flag and mounts a child whose effect does not throw.
          </p>
        </>
      ),
    },
  ],
};
