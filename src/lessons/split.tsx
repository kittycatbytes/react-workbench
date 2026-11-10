import { lazy, Suspense, useState, type ComponentType } from "react";
import { sample } from "../workbench/sample.ts";
import type { DemoProps, Lesson } from "../workbench/types.ts";
import { CatchBoundary } from "../workbench/bits.tsx";
import ChartFigure from "./ChartFigure.tsx";

function loadHeavyChart() {
  return Promise.all([
    import("./HeavyChart.tsx"),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 700);
    }),
  ]).then(([module]) => module);
}

const LazyChart = lazy(loadHeavyChart);

function ChartFallback() {
  return (
    <div className="fallback" role="status">
      <p>Loading chunk...</p>
      <div className="bars" aria-hidden="true">
        <span style={{ height: 36 }} />
        <span style={{ height: 64 }} />
        <span style={{ height: 48 }} />
        <span style={{ height: 80 }} />
        <span style={{ height: 52 }} />
      </div>
    </div>
  );
}

function LoadButton({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}>
      {show ? "Unload chart" : "Load chart"}
    </button>
  );
}

function SplitStage() {
  const [show, setShow] = useState(false);
  return (
    <div className="widget stack">
      <LoadButton show={show} onToggle={() => setShow((value) => !value)} />
      {show ? (
        <Suspense fallback={<ChartFallback />}>
          <LazyChart />
        </Suspense>
      ) : (
        <p className="hint">The chart module is not mounted.</p>
      )}
    </div>
  );
}

function EagerStage() {
  const [show, setShow] = useState(false);
  return (
    <div className="widget stack">
      <LoadButton show={show} onToggle={() => setShow((value) => !value)} />
      {show ? <ChartFigure /> : <p className="hint">The chart is a static import. Nothing to wait for.</p>}
    </div>
  );
}

function NoBoundaryStage() {
  const [Chart, setChart] = useState<ComponentType | null>(null);
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className="widget stack">
      <button
        type="button"
        onClick={() => {
          setChart(() => lazy(loadHeavyChart));
        }}
      >
        Load chart
      </button>
      <CatchBoundary
        resetKey={String(resetKey)}
        title="No Suspense boundary"
        onReset={() => {
          setChart(null);
          setResetKey((value) => value + 1);
        }}
      >
        {Chart ? (
          <Chart />
        ) : (
          <p className="hint" data-testid="waiting-hint">
            Load the chart. There is no Suspense above it.
          </p>
        )}
      </CatchBoundary>
    </div>
  );
}

function FailedStage() {
  const [attempt, setAttempt] = useState(0);
  const [Chart, setChart] = useState<ComponentType>(() =>
    lazy(() => Promise.reject(new Error("Chunk failed to load"))),
  );
  return (
    <div className="widget stack">
      <CatchBoundary
        resetKey={String(attempt)}
        title="Chunk failed"
        onReset={() => {
          setChart(() => lazy(loadHeavyChart));
          setAttempt((value) => value + 1);
        }}
      >
        <Suspense fallback={<ChartFallback />}>
          <Chart />
        </Suspense>
      </CatchBoundary>
    </div>
  );
}

const splitCode = sample`
  function loadHeavyChart() {
    return Promise.all([
      import("./HeavyChart.tsx"),
      new Promise((resolve) => setTimeout(resolve, 700)),
    ]).then(([module]) => module);
  }

  const LazyChart = lazy(loadHeavyChart);

  function SplitStage() {
    const [show, setShow] = useState(false);
    return show ? (
      <Suspense fallback={<p>Loading chunk...</p>}>
        <LazyChart />
      </Suspense>
    ) : null;
  }
`;

const eagerCode = sample`
  import ChartFigure from "./ChartFigure.tsx";

  function EagerStage() {
    const [show, setShow] = useState(false);
    return show ? <ChartFigure /> : null;
  }
`;

const missingCode = sample`
  function NoBoundaryStage() {
    const [Chart, setChart] = useState(null);
    return (
      <CatchBoundary>
        <button onClick={() => setChart(() => lazy(loadHeavyChart))}> /*focus*/
          Load chart
        </button>
        {Chart ? <Chart /> : null} /*focus*/
      </CatchBoundary>
    );
  }
`;

const failCode = sample`
  const Broken = lazy(() => Promise.reject(new Error("Chunk failed to load")));

  function retry() {
    setChart(() => lazy(loadHeavyChart));
  }
`;

export function SplitDemo({ scenarioId }: DemoProps) {
  if (scenarioId === "eager") return <EagerStage />;
  if (scenarioId === "missing") return <NoBoundaryStage />;
  if (scenarioId === "fail") return <FailedStage />;
  return <SplitStage />;
}

export const splitLesson: Lesson = {
  id: "split",
  kicker: "lazy",
  title: "Code splitting and Suspense",
  blurb: "lazy loads a component later. Suspense is where the loading UI goes while it waits.",
  Demo: SplitDemo,
  scenarios: [
    {
      id: "split",
      label: "lazy and Suspense",
      tease: "The chart is a separate module. The first load waits. The next one is cached.",
      tryThis: "Load the chart. Unload it and load it again.",
      code: splitCode.text,
      focus: [2, 3, 8, 13, 14, 15],
      explanation: (
        <>
          <p>
            <code>lazy</code> takes a function that returns <code>import()</code>. Vite
            emits that module as its own file, so the chart is not in the first
            download. The loader also waits 700ms, so the fallback has time to paint
            on a local machine. A real module would skip that timer. The wait you
            would keep is the download itself.
          </p>
          <p>
            Rendering <code>LazyChart</code> starts the load. While that promise is
            pending, the nearest <code>Suspense</code> paints "Loading chunk..."
            instead of the chart. Unload and load again. The second time the chart
            appears immediately, because <code>lazy</code> remembers the module it
            already loaded.
          </p>
        </>
      ),
    },
    {
      id: "eager",
      label: "Static import",
      tease: "The chart is in this bundle. It appears on the same render.",
      tryThis: "Load the chart.",
      code: eagerCode.text,
      focus: [1, 5],
      explanation: (
        <>
          <p>
            The chart is a static import. It ships with this lesson, and this version
            does not suspend. Load it and it appears on the same render. Nothing here
            for <code>Suspense</code> to catch.
          </p>
          <p>
            Reach for <code>lazy</code> when the module is heavy or rarely opened. A
            button people always need is a poor split. A chart they might never open
            is a good one.
          </p>
        </>
      ),
    },
    {
      id: "missing",
      label: "No Suspense boundary",
      tease: "The chart still waits. Nothing paints a loading state, and the boundary stays quiet.",
      tryThis: "Load the chart and watch the hint. It stays until the chart replaces it.",
      code: missingCode.text,
      focus: missingCode.focus,
      explanation: (
        <>
          <p>
            Load chart builds a new <code>lazy()</code> and renders it with no{" "}
            <code>Suspense</code> above it. The loader still waits 700ms. React does
            not invent a fallback. The hint stays on screen until the module is ready,
            then the chart replaces it.
          </p>
          <p>
            The error boundary stays quiet. Waiting is not a throw. A rejected import,
            in the next scenario, is a throw, and that one does reach the boundary.{" "}
            <code>Suspense</code> is what gives the wait a place to render. Without
            it, the previous UI just sits there.
          </p>
        </>
      ),
    },
    {
      id: "fail",
      label: "The chunk rejects",
      tease: "A failed import is an error, not a loading state. Retry builds a new lazy.",
      tryThis: "Read the failure, then reset the boundary.",
      code: failCode.text,
      focus: [1, 4, 5],
      explanation: (
        <>
          <p>
            This <code>lazy</code> loader rejects. A failed import is an error, so{" "}
            <code>Suspense</code> does not handle it. The error boundary does.
          </p>
          <p>
            <code>lazy</code> remembers the rejected promise. Resetting the same
            component would fail again. The reset button builds a new{" "}
            <code>lazy</code> around the real chart module and mounts that. The
            fallback shows while that one loads, then the chart appears.
          </p>
        </>
      ),
    },
  ],
};
